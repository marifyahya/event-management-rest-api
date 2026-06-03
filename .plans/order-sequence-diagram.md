# Order Reservation Sequence Diagram

This document captures the attendee checkout flow with:

- checkout page before stock reservation
- Redis reservation created only after order confirmation
- synchronous order creation
- asynchronous payment initialization
- Midtrans webhook for final payment confirmation

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
    participant M as Midtrans

    U->>FE: Click "Order"
    FE->>FE: Open checkout page
    Note over FE,U: User selects quantity and payment method\nNo reservation yet

    U->>FE: Click "Confirm Order"
    FE->>API: POST /api/orders\n(eventId, quantity, paymentMethod)
    
    API->>API: Generate orderNumber

    API->>R: Atomic reserve(orderNumber, quantity, ttl=10m)
    alt Stock available
        R-->>API: success, expiresAt
        API->>DB: Create order(orderNumber, status=pending, expiresAt, quantity)
        DB-->>API: orderId
        API->>Q: Enqueue create-payment(orderId)
        API->>Q: Schedule order-expire(orderId) delay=10m
        API-->>FE: order data (pending)

        FE->>FE: Show countdown 10 minutes
        FE->>API: GET /api/orders/:orderId (poll)

        Q->>WP: Deliver create-payment job
        WP->>DB: Load order
        WP->>M: Create Snap transaction (with custom_expiry=10m)
        M-->>WP: snapToken, redirectUrl
        WP->>DB: Create payment record(snapToken)

        FE->>API: GET /api/orders/:orderId (poll)
        API->>DB: Read order + payment
        DB-->>API: payment ready
        API-->>FE: snapToken / redirectUrl

        U->>M: Complete payment
        M-->>API: Payment webhook
        API->>DB: Mark order & payment paid
        API->>DB: Issue tickets
        API->>R: Clear active reservation
        API-->>M: 200 OK

    else Stock unavailable
        R-->>API: insufficient stock / sold out
        API-->>FE: HTTP 400 (Event sold out / not available)
    end

    opt Order pending after 10 minutes
        Q->>WE: Deliver order-expire job
        WE->>DB: Optimistic update order status=EXPIRED (where PENDING)
        WE->>DB: Mark payment EXPIRE
        WE->>R: releaseReservation(orderNumber)
    end
```

## Behavioral Notes

- Reservation starts only after the attendee clicks `Confirm Order`.
- Opening the checkout page does not hold stock.
- The API must return `orderId` immediately after the order row is created.
- The frontend should continue the same pending order if the attendee returns before expiry.
- Reservation TTL is 10 minutes.
- Quantity must be part of the atomic reservation request.
