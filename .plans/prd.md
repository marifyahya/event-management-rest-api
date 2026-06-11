# Event Management REST API PRD

This file explain about product requirements, database, endpoints, timeline, and technical notes for Event Management REST API.

---

## 1. Product Summary

### Background

Event makers need backend system to manage events, people, tickets, check-in, and report. Without good system, registration and ticket check can have double data, fake ticket, and wrong report.

### Product Goals

- Make REST API to create, manage, and show events.
- Support people to order ticket, pay with Midtrans, and get digital ticket.
- Make easy check-in using ticket code or QR token.
- Give simple dashboard and report for event makers.
- Keep data safe with login, role access, and check request data.

### User Personas

| Persona | Primary Needs | Pain Points |
| --- | --- | --- |
| Event Organizer | Create events, see people, see reports | Hard to check capacity and check-in |
| Attendee | Buy event ticket and get ticket | Manual register and ticket is easily lost |
| Admin | Manage users, events, and system | Need good data and access control |

### Core Features

| Priority | Feature | Description |
| --- | --- | --- |
| High | Login & Access | Register, login, profile, role access |
| High | Event Management | Create, read, update, delete event, publish, cancel |
| High | Order & Ticketing | Buy ticket, make ticket, see ticket |
| High | Midtrans Payment | Make payment, process webhook, confirm ticket |
| Mid | Email Notifications | Send email for order, payment success/fail, and ticket |
| High | Check-in | Validate ticket and check-in people |
| Mid | Dashboard | See event, ticket, and check-in numbers |
| Mid | Reports | See people and check-in reports |
| Low | CSV Export | Download report data to CSV file |

### Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | Fast API response < 300ms, use pagination for long list |
| Security | Hash password, use JWT, role access, limit login request |
| Scalability | Code split by domain, schema ready for migration |
| Reliability | Use database transaction for order, payment, ticket, check-in |
| Maintainability | Use Zod to check data, same error format for all |

---

## 2. Epic & Implementation Tasks

### Epic Breakdown

| Epic | Name | Outcome |
| --- | --- | --- |
| Epic 1 | Setup & Authentication | Secure API with user login and role access |
| Epic 2 | Event Management | Organizer can manage event lifecycle |
| Epic 3 | Order, Payment & Ticketing | Attendees can order, pay via Xendit/Midtrans, and receive tickets |
| Epic 4 | Check-in & Validation | Staff can validate and check in tickets |
| Epic 5 | Dashboard & Reporting | Organizer can view metrics and reports |
| Epic 6 | Email Notification | Users receive email confirmation after payment and ticket issuance |

### Subtasks per Epic

> Tasks are intentionally small and target roughly 25 minutes each.

#### Epic 1: Setup & Authentication

- [x] [Database] User schema migration: add `role`, `last_login_at`, and timestamps
- [x] [Backend] `POST /api/auth/register`: request validator
- [x] [Backend] `POST /api/auth/register`: create self-registered `participant` with hashed password
- [x] [Backend] `POST /api/users`: admin creates `admin` or `staff` with hashed password
- [x] [Backend] `GET /api/users`: admin user list with role/status/search/pagination
- [x] [Backend] `GET /api/users/:userId`: admin user detail
- [x] [Backend] `PATCH /api/users/:userId`: admin updates name/role/status/password
- [x] [Backend] `DELETE /api/users/:userId`: admin deactivates user without removing historical data (soft delete)
- [x] [Backend] `POST /api/auth/login`: validate credentials and return token
- [x] [Backend] `GET /api/auth/me`: fetch current user profile
- [x] [Backend] `POST /api/auth/logout`: logout response
- [x] [Integration] `requireAuth` middleware
- [x] [Integration] `requireRole` middleware

#### Epic 2: Event Management

- [x] [Database] Event schema migration: create `events` table
- [x] [Database] Add `organizer` relation to Event model
- [x] [Backend] `POST /api/admin/events`: create draft event
- [x] [Backend] `GET /api/admin/events`: list events with filters/pagination/sort
- [x] [Backend] `GET /api/admin/events/:eventId`: event detail with organizer info
- [x] [Backend] `PATCH /api/admin/events/:eventId`: update event
- [x] [Backend] `DELETE /api/admin/events/:eventId`: lifecycle-controlled delete
- [x] [Backend] `POST /api/admin/events/:eventId/publish`: publish event
- [x] [Backend] `POST /api/admin/events/:eventId/cancel`: cancel event
- [x] [Backend] `POST /api/admin/events/:eventId/archive`: archive event
- [x] [Backend] `POST /api/admin/events/:eventId/move-to-draft`: move cancelled event back to draft
- [x] [Backend] `GET /api/events`: public event list (published only) with sorting
- [x] [Backend] `GET /api/events/:eventId`: public event detail (published only)
- [x] [Backend] Add `sortBy`/`sort` query params with whitelist validation

Current lifecycle:

- `POST /api/admin/events/:id/publish`
- `POST /api/admin/events/:id/cancel`
- `POST /api/admin/events/:id/archive`
- `POST /api/admin/events/:id/move-to-draft`
- `DELETE /api/admin/events/:id` (soft delete via `deletedAt`, only for `archived` events)

Current scope note:

- Ownership-based authorization (organizer-level ownership checks) is intentionally out of scope for now.

#### Epic 3: Order, Payment & Ticketing

- [x] [Database] Create `orders` table for event payment state
- [x] [Database] Create `payments` table for payment transactions
- [x] [Database] Create `tickets` table
- [x] [Integration] Setup Redis connection (`src/libs/redis.ts`)
- [x] [Integration] Setup BullMQ `create-payment` and `order-expire` queues
- [x] [Integration] `create-payment` worker: process payment via active provider (Xendit/Midtrans)
- [x] [Integration] `order-expire` worker: handle order expiry and release stock
- [x] [Backend] Create `order-status` constants
- [x] [Backend] Create `payment-status` constants
- [x] [Backend] `POST /api/orders`: synchronous order creation and enqueue workers
- [x] [Integration] `GET /api/orders/:orderId`: order/payment polling endpoint
- [x] [Integration] `POST /api/payments/webhook`: process callback and update order (Xendit & Midtrans)
- [x] [Backend] Issue digital ticket only after successful payment (via webhook PAID handler)
- [x] [Integration] Send payment success + ticket confirmation email after tickets are issued

#### Epic 4: Check-in & Validation

- [x] [Backend] `POST /api/admin/check-ins`: single endpoint to validate and check-in ticket (with duplicate prevention)
- [x] [Integration] Restrict check-in access to organizer/staff/admin

#### Epic 5: Dashboard & Reporting

- [x] [Database] Ensure aggregation-friendly indexes/relations for events, tickets, payments, check-ins
- [x] [Backend] `GET /api/admin/dashboard/summary`: total events/tickets/check-ins
- [x] [Backend] `GET /api/admin/events/:eventId/stats`: event statistics
- [x] [Backend] Support `?export=csv` parameter on `GET /api/admin/events` (filtered, no limit)
- [x] [Backend] Support `?export=csv` parameter on `GET /api/admin/orders` (filtered, no limit)

#### Epic 6: Email Notification

- [x] [Integration] Setup email provider (e.g. Nodemailer + SMTP / Resend / SendGrid)
- [x] [Integration] Create `send-email` BullMQ queue and worker
- [x] [Integration] Design payment success email template (order summary + ticket list)
- [x] [Integration] Enqueue send-email job from `handlePaid` in `payment-webhook.service.ts`
- [x] [Integration] Email contains: event name, date, location, ticket codes, QR token info
- [x] [Integration] Handle email send failure gracefully (log error, do not block webhook response)

---

## 3. Database Schema

### Entity Relationship Overview

```text
users 1--N events
users 1--N orders
users 1--N tickets
events 1--N orders
events 1--N tickets
orders 1--1 payments
orders 1--N tickets
```

### `users`

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

### `events`

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

### `orders`

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

### `payments`

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

### `tickets`

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

### Recommended Indexes

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

### Audit Timestamp Decision

For `users` and `events`, `created_at` and `updated_at` are intentionally nullable.

Reasons:

- Easier legacy/backfill imports
- Prevent insert failures when historical metadata is incomplete
- Normal API flow still sets timestamps consistently

Implementation notes:

- New API records should continue setting `created_at`/`updated_at` consistently.
- Date-based sorting/filtering queries should handle `NULL` values.

### User Query Optimization Notes

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

---

## 5. Minimum API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Check API is alive |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | See my profile |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/events` | List public events |
| GET | `/api/events/:eventId` | Detail public event |
| POST | `/api/events/:eventId/order` | Buy ticket |
| GET | `/api/orders/:orderId` | Check order and payment |
| POST | `/api/payments/midtrans/webhook` | Midtrans callback url |
| GET | `/api/tickets/:ticketId` | Detail ticket |
| POST | `/api/admin/events` | Create new event |
| GET | `/api/admin/events` | List events for admin |
| GET | `/api/admin/events/:eventId` | Detail event for admin |
| PATCH | `/api/admin/events/:eventId` | Update event data |
| DELETE | `/api/admin/events/:eventId` | Delete or archive event |
| POST | `/api/admin/events/:eventId/publish` | Make event public |
| POST | `/api/admin/events/:eventId/cancel` | Cancel event |
| POST | `/api/admin/events/:eventId/archive` | Archive event |
| POST | `/api/admin/events/:eventId/move-to-draft` | Move cancelled event to draft |
| POST | `/api/admin/check-ins/validate` | Check if ticket is real |
| POST | `/api/admin/check-ins` | Scan and check-in ticket |
| GET | `/api/admin/events/:eventId/check-ins` | See event check-in list |
| GET | `/api/admin/dashboard/summary` | See dashboard total |
| GET | `/api/admin/events/:eventId/stats` | See event numbers |
| GET | `/api/admin/events?export=csv|xlsx` | Download events data as CSV or XLSX |
| GET | `/api/admin/orders?export=csv|xlsx` | Download orders data as CSV or XLSX |

---

## 6. Technical Notes

### Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (main database)
- Redis (queue system)
- BullMQ (background worker)
- Zod (check request body)
- dotenv (load env variables)

### Suggested Libraries

| Library | Purpose |
| --- | --- |
| `bcrypt` or `argon2` | Hash user password |
| `jsonwebtoken` | Make JWT token |
| `helmet` | Add security headers |
| `cors` | Setup CORS |
| `express-rate-limit` + `rate-limit-redis` | Limit request using Redis |
| `nanoid` | Make ticket code and QR token |
| `fast-csv` | Download to CSV (Streaming) |
| `exceljs` | Download to XLSX (Streaming) |
| `midtrans-client` | Call Midtrans API |
| `nodemailer` | Send email |
| `bullmq` + `ioredis` | Queue order, payment, email, PDF |
| `puppeteer` | Make HTML to PDF ticket |
| `@supabase/supabase-js` | Save PDF to cloud |

### Environment Variables

```env
# ==========================================
# Core Configuration
# ==========================================
PORT=3000
NODE_ENV=development
LOG_LEVEL="debug"
APP_URL="http://localhost:3000"
JWT_SECRET="your_jwt_secret_key"

# ==========================================
# Database Configuration
# ==========================================
POSTGRES_USER="event_user"
POSTGRES_PASSWORD="event_password"
POSTGRES_DB="event_management"
POSTGRES_PORT=5432
DATABASE_URL="postgresql://event_user:event_password@localhost:5432/event_management?schema=public"

# ==========================================
# Redis & Queue Configuration
# ==========================================
REDIS_USER=""
REDIS_PASSWORD=""
REDIS_PORT=6379
REDIS_URL="redis://localhost:6379"

RESERVATION_TTL=600

# ==========================================
# Payment Gateway Configuration
# ==========================================
PAYMENT_GATEWAY_PROVIDER="xendit"

# Midtrans Setup
MIDTRANS_API_URL="https://app.sandbox.midtrans.com/snap/v1/transactions"
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""

# Xendit Setup
XENDIT_API_URL="https://api.xendit.co"
XENDIT_SECRET_KEY=""
XENDIT_WEBHOOK_TOKEN=""

# ==========================================
# Email (SMTP) Configuration
# ==========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="Event Organizer <noreply@example.com>"
SMTP_TO_MAIL=""

# ==========================================
# Storage Configuration
# ==========================================
STORAGE_DRIVER="local"

# Supabase Storage Setup
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET="event-orgnzr"
```

### Payment & Order Flow Rules

- **Multi-Gateway Support**: We support both **Midtrans** and **Xendit** as payment gateways (configurable via `PAYMENT_GATEWAY_PROVIDER`).
- **Stock Reservation**: When a user creates an order, we use Redis to reserve the ticket slot temporarily (`RESERVATION_TTL=600` seconds) to prevent overselling.
- **Asynchronous Payment Link**: Order is saved to the database in `PENDING` state, and a job is sent to the `create-payment` queue.
- **Worker Processing**: The `create-payment` worker calls the chosen payment gateway (Midtrans/Xendit) to generate a checkout URL, then updates the database.
- **Webhook Handling**: The system listens to webhooks from the payment gateway to update payment status (`PAID`, `EXPIRED`, `CANCELLED`).
- **Ticket Issuance**: Digital tickets are created only when the payment webhook confirms a `PAID` status.
- **Background Generation**: Once paid, jobs are dispatched to `generate-pdf` to create the e-ticket, and `send-email` to deliver it.
- **Auto-Expiration**: Unpaid orders are automatically expired by the `order-expire` worker after the TTL runs out.
- **Concurrency Limitation**: One user can only have 1 active (pending) order for 1 event at a time to prevent hoarding.

### Rate Limiting Rules

- Save limit data in Redis.
- **Global Limit**: 100 request in 1 minute per user IP and browser. For all `/api`.
- **Auth Limit**: 5 times in 15 minute (IP and Email). For login and register.
- **Order Limit**: 3 order in 1 minute (User ID or IP). For make order.
- Return status `429 Too Many Requests` if limit reach.
- Skip limit if running test (`NODE_ENV=test`).
