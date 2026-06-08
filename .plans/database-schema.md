# Event Management REST API Database Schema

This document describes the database schema plan for the Event Management REST API.

---

## Entity Relationship Overview

```text
users 1--N events
users 1--N orders
users 1--N tickets
events 1--N orders
events 1--N tickets
orders 1--1 payments
orders 1--N tickets
```

---

## `users`

Stores account data for admin, organizer, staff, and attendee users.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | User ID |
| `full_name` | text | not null | User full name |
| `email` | text | not null, unique | Login email |
| `password` | text | not null | Password hash |
| `role` | text | not null, default `attendee` | `admin`, `organizer`, `staff`, `attendee` |
| `is_active` | boolean | default true | Account status |
| `last_login_at` | timestamp | nullable | Last login time |
| `created_at` | timestamp | nullable (default now) | Creation time |
| `updated_at` | timestamp | nullable | Last update time |
| `deleted_at` | timestamp | nullable | Soft delete marker |

---

## `events`

Stores event data created by organizers.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | Event ID |
| `organizer_id` | integer | FK `users.id`, not null | Event owner |
| `title` | text | not null | Event title |
| `description` | text | nullable | Event description |
| `category` | text | nullable | Event category |
| `location` | text | not null | Event location |
| `start_at` | timestamp | not null | Start datetime |
| `end_at` | timestamp | not null | End datetime |
| `price` | integer | not null, default 0 | Ticket price |
| `capacity` | integer | not null | Participant capacity |
| `status` | text | not null, default `draft` | `draft`, `published`, `cancelled`, `archived` |
| `cancel_reason` | text | nullable | Cancellation reason |
| `published_at` | timestamp | nullable | Publish datetime |
| `created_at` | timestamp | nullable (default now) | Creation time |
| `updated_at` | timestamp | nullable | Last update time |
| `deleted_at` | timestamp | nullable | Soft delete marker |

---

## `orders`

Stores event ticket purchase orders.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | text/uuid | PK | Order ID |
| `order_number` | text | not null, unique | Human-readable order number |
| `event_id` | integer | FK `events.id`, not null | Related event |
| `user_id` | integer | FK `users.id`, not null | Buyer |
| `status` | text | not null, default `pending` | `pending`, `paid`, `failed`, `expired`, `cancelled` |
| `quantity` | integer | not null, default 1 | Ticket quantity |
| `subtotal_amount` | integer | not null | Price before fees |
| `admin_fee` | integer | not null, default 0 | Admin fee |
| `total_amount` | integer | not null | Total payment amount |
| `expires_at` | timestamp | nullable | Payment deadline |
| `paid_at` | timestamp | nullable | Successful payment datetime |
| `ticket_pdf_url` | text | nullable | URL to downloaded PDF ticket in Storage |
| `created_at` | timestamp | not null | Creation time |
| `updated_at` | timestamp | not null | Last update time |

---

## `payments`

Stores payment transactions from the active payment provider (Xendit or Midtrans).

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | text/uuid | PK | Payment ID |
| `order_id` | text/uuid | FK `orders.id`, unique, not null | Related order |
| `provider` | text | not null, default `xendit` | Active provider: `xendit`, `midtrans` |
| `provider_order_id` | text | not null, unique | Our order number sent to provider |
| `provider_transaction_id` | text | nullable | Provider transaction ID (from webhook, e.g. Xendit `payment_id`, Midtrans `transaction_id`) |
| `payment_method` | text | nullable | Generic payment method key (e.g. `BCA_VA`, `GOPAY`, `QRIS`) |
| `status` | text | not null, default `pending` | `pending`, `paid`, `deny`, `cancel`, `expire`, `failure` |
| `gross_amount` | integer | not null | Gross payment amount |
| `provider_token` | text | nullable | Provider token (Xendit: invoice `id`, Midtrans: Snap `token`) |
| `checkout_url` | text | nullable | Redirect URL to provider payment page |
| `raw_notification` | jsonb | nullable | Latest webhook payload |
| `paid_at` | timestamp | nullable | Successful payment datetime |
| `created_at` | timestamp | not null | Creation time |
| `updated_at` | timestamp | not null | Last update time |

---

## `tickets`

Stores digital tickets issued after successful payment.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | Ticket ID |
| `order_id` | text/uuid | FK `orders.id`, nullable | Related order |
| `event_id` | integer | FK `events.id`, not null | Related event |
| `user_id` | integer | FK `users.id`, not null | Ticket owner |
| `ticket_code` | text | not null, unique | Human-readable ticket code |
| `qr_token` | text | not null, unique | QR validation token |
| `status` | text | not null, default `active` | `active`, `cancelled`, `used`, `expired` |
| `issued_at` | timestamp | not null | Issued datetime |
| `checked_in_at` | timestamp | nullable | Check-in datetime |
| `created_at` | timestamp | not null | Creation time |
| `updated_at` | timestamp | not null | Last update time |

---


---

## Recommended Indexes

| Table | Index | Purpose |
| --- | --- | --- |
| `users` | `email` | Login lookup |
| `users` | `(role, is_active, created_at DESC)` | Admin user list with role/status filters and latest sorting |
| `users` | `(created_at DESC)` | Default latest-first user sorting |
| `users` | `GIN (full_name gin_trgm_ops)` | Fast `contains` search on full name |
| `users` | `GIN (email gin_trgm_ops)` | Fast `contains` search on email |
| `events` | `organizer_id` | Organizer event queries |
| `events` | `status` | Published/draft filtering |
| `events` | `start_at` | Date sorting/filtering |
| `orders` | `event_id` | Order by event |
| `orders` | `user_id` | Order by user |
| `orders` | `status` | Order status filter |
| `payments` | `provider_order_id` | Webhook lookup by order number |
| `payments` | `order_id` | Payment-order relation |
| `tickets` | `ticket_code` | Ticket validation |
| `tickets` | `qr_token` | QR validation |
| `tickets` | `event_id` | Tickets by event |

---

## Audit Timestamp Decision

For `users` and `events`, `created_at` and `updated_at` are intentionally nullable.

Reasons:

- Easier legacy/backfill imports
- Prevent insert failures when historical metadata is incomplete
- Normal API flow still sets timestamps consistently

Implementation notes:

- New API records should continue setting `created_at`/`updated_at` consistently.
- Date-based sorting/filtering queries should handle `NULL` values.

---

## User Query Optimization Notes

Current implementation patterns:

- Login uses exact `email` lookup (`findUnique`) -> unique `email` index is critical.
- User list (`getAllUser`) uses:
  - exact filters: `role`, `isActive`
  - contains/ILIKE-style filters: `fullName`, `email`
  - sorting by `createdAt DESC`

High-priority indexes:

1. BTREE composite index on `users(role, is_active, created_at DESC)`
2. BTREE index on `users(created_at DESC)`

Optional large-scale search indexes:

1. `pg_trgm` + GIN on `full_name`
2. `pg_trgm` + GIN on `email`

Example PostgreSQL SQL:

```sql
CREATE INDEX IF NOT EXISTS idx_users_role_active_created_at
  ON users (role, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_created_at_desc
  ON users (created_at DESC);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm
  ON users USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_email_trgm
  ON users USING gin (email gin_trgm_ops);
```
