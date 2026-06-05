# Order Reservation Sequence Diagram

This document captures the attendee checkout flow with:

- checkout page before stock reservation
- Redis reservation created only after order confirmation
- synchronous order creation
- asynchronous payment initialization
- Xendit/Midtrans webhook for final payment confirmation

## Main Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Frontend
    participant API as Backend API
    participant R as Redis
    participant DB as PostgreSQL
    participant Q as BullMQ
    participant WP as Payment Worker
    participant WE as Expire Worker
    participant P as Payment Provider (Xendit/Midtrans)
    participant WN as Notification Worker

    U->>FE: Click "Order"
    FE->>FE: Open checkout page
    Note over FE,U: User selects quantity and payment method\nNo reservation yet

    U->>FE: Click "Confirm Order"
    FE->>API: POST /api/orders\n(eventId, quantity, paymentMethod)
    
    API->>API: Generate orderNumber

    API->>R: Atomic reserve(orderNumber, quantity, ttl=RESERVATION_TTL)
    alt Stock available
        R-->>API: success, expiresAt
        API->>DB: Create order(orderNumber, status=pending, expiresAt, quantity)
        DB-->>API: orderId
        API->>Q: Enqueue create-payment(orderId, paymentMethod)
        API->>Q: Schedule order-expire(orderId) delay=RESERVATION_TTL
        API-->>FE: order data (pending)

        FE->>FE: Show countdown timer
        FE->>API: GET /api/orders/:orderId (poll)

        Q->>WP: Deliver create-payment job
        WP->>DB: Load order
        WP->>P: Create transaction\n(Xendit: POST /v2/invoices\nMidtrans: Snap transaction)
        P-->>WP: providerToken, checkoutUrl
        WP->>DB: Create/Update payment record\n(providerToken, checkoutUrl)

        FE->>API: GET /api/orders/:orderId (poll)
        API->>DB: Read order + payment
        DB-->>API: payment ready
        API-->>FE: checkoutUrl / providerToken

        U->>P: Complete payment on provider page
        P-->>API: POST /api/payments/webhook
        API->>API: verifyWebhookSignature\n(x-callback-token or SHA512)
        API->>API: parseWebhookPayload → PAID/EXPIRED/CANCELLED
        
        API->>R: Acquire Distributed Lock (SET NX EX 15)
        opt Lock acquired
            API->>DB: Update payment (status=PAID, providerTransactionId, paidAt)
            API->>DB: Update order (status=PAID, paidAt)
            API->>DB: Issue tickets (createMany with NanoID)
            API->>R: confirmReservation → DEL reservation:{orderNumber}
            API->>Q: Enqueue send-email(PaymentSuccessEmail, payload)
            API->>R: Release Distributed Lock
            
            Q->>WN: Deliver send-email job
            WN->>WN: Render Handlebars Template (Inline CSS)
            WN->>U: Send Email via SMTP Pool
        end
        API-->>P: 200 OK

    else Stock unavailable
        R-->>API: insufficient stock / sold out
        API-->>FE: HTTP 400 (Event sold out / not available)
    end

    opt Order pending after RESERVATION_TTL
        Q->>WE: Deliver order-expire job
        WE->>DB: Optimistic update order status=EXPIRED (where PENDING)
        WE->>DB: Mark payment EXPIRE
        WE->>R: releaseReservation(orderNumber) → restore stock
    end

    opt Webhook EXPIRED or CANCELLED received
        P-->>API: POST /api/payments/webhook (status=EXPIRED/CANCELLED)
        API->>DB: Update payment + order status
        API->>R: releaseReservation → restore stock
        API-->>P: 200 OK
    end
```

## Behavioral Notes

- Reservation starts only after the attendee clicks `Confirm Order`.
- Opening the checkout page does not hold stock.
- The API must return `orderId` immediately after the order row is created.
- The frontend should continue the same pending order if the attendee returns before expiry.
- Reservation TTL is configurable via `RESERVATION_TTL` env var (default: 5 minutes).
- Quantity must be part of the atomic reservation request.
- Webhook endpoint `POST /api/payments/webhook` is public (no auth middleware).
- Idempotency: 
  - Uses **Redis Distributed Lock** (`SET NX EX 15`) to prevent race conditions from concurrent duplicate webhooks.
  - Webhook is ignored if order is already in a terminal state (`paid`, `expired`, `cancelled`).
- Provider signature is verified before any DB operation:
  - **Xendit**: `x-callback-token` header compared against `XENDIT_WEBHOOK_TOKEN`
  - **Midtrans**: SHA512(`order_id + status_code + gross_amount + server_key`) from body
- Tickets use **NanoID** (10-chars, unambiguous alphabet) to eliminate DB `UniqueConstraint` collisions.

## Payment Provider Strategy

Active provider is selected via `PAYMENT_GATEWAY_PROVIDER` env var (default: `xendit`).

| Feature | Xendit | Midtrans |
| --- | --- | --- |
| Transaction endpoint | `POST /v2/invoices` | Snap `POST /snap/v1/transactions` |
| Checkout URL | `invoice_url` | `redirect_url` |
| Provider token | Invoice `id` | Snap `token` |
| Provider transaction ID (webhook) | `payment_id` | `transaction_id` |
| Webhook auth | `x-callback-token` header | SHA512 signature in body |
