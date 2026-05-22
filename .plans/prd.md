# Event Management REST API PRD

This document summarizes product requirements, database scope, minimum endpoints, timeline, and technical notes for the Event Management REST API.

---

## 1. Product Summary

### Background

Event organizers need a centralized backend system to manage events, attendees, tickets, check-ins, and reporting. Without a structured system, registration and ticket validation are prone to duplicate data, invalid tickets, and inaccurate reporting.

### Product Goals

- Provide a REST API to create, manage, and publish events.
- Support attendee registration, limited ticket competition, Midtrans payments, and digital ticket issuance.
- Simplify check-in with ticket code or QR token validation.
- Provide basic dashboards and reports for organizers.
- Protect data with authentication, authorization, and request validation.

### User Personas

| Persona | Primary Needs | Pain Points |
| --- | --- | --- |
| Event Organizer | Create events, monitor attendees, view reports | Hard to track capacity and check-in status |
| Attendee | Register for events and receive tickets | Manual registration and poor ticket traceability |
| Admin | Manage users, events, and system access | Needs consistent data and access controls |

### Core Features

| Priority | Feature | Description |
| --- | --- | --- |
| High | Authentication & Authorization | Register, login, profile, role-based access |
| High | Event Management | Event CRUD, publish, cancel, filter |
| High | Registration & Ticketing | Event registration, ticket reservation, ticket generation, ticket view |
| High | Midtrans Payment | Create payment transactions, process webhooks, confirm tickets after success |
| Mid | Email Notifications | Send order, payment success/failure, and ticket emails |
| High | Check-in & Validation | Ticket validation and attendee check-in |
| Mid | Dashboard | Event, attendee, ticket, and check-in statistics |
| Mid | Reports | Registration and check-in reports |
| Low | CSV Export | Export report data to CSV |

### Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | Simple API responses < 300ms, pagination for large lists |
| Security | Password hashing, JWT/session, RBAC, login rate limiting |
| Scalability | Domain-based module structure and migration-ready schema |
| Reliability | DB transactions for ticket competition, payment, ticketing, and check-in |
| Maintainability | Consistent Zod validation and standardized error format |

---

## 2. Epic & Implementation Tasks

Epic breakdown and implementation checklist are maintained in a dedicated file to keep this PRD concise.

See: [epics.md](./epics.md)

---

## 3. Database Schema

Full table schema, relationships, recommended indexes, and Prisma draft are maintained in:

[database-schema.md](./database-schema.md)

---

## 4. Suggested Timeline

| Day | Focus | Output |
| --- | --- | --- |
| Day 1 | Authentication | Register, login, auth middleware |
| Day 2 | Event Management | Event schema and CRUD |
| Day 3 | Registration & Ticketing | Registration flow and ticket transactions |
| Day 4 | Payment | Midtrans transactions, webhook, payment status |
| Day 5 | Check-in | Ticket validation and check-in |
| Day 6 | Dashboard & Reports | Stats and reporting endpoints |
| Day 7 | Hardening | Error handling, security review, edge cases |
| Day 8 | Testing & Docs | Build checks, manual tests, API docs |

---

## 5. Minimum API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/events` | Create event |
| GET | `/api/events` | List events |
| GET | `/api/events/:eventId` | Event detail |
| PATCH | `/api/events/:eventId` | Update event |
| DELETE | `/api/events/:eventId` | Delete/archive event by lifecycle rule |
| POST | `/api/events/:eventId/publish` | Publish event |
| POST | `/api/events/:eventId/cancel` | Cancel event |
| POST | `/api/events/:eventId/register` | Register to event |
| POST | `/api/events/:eventId/ticket-reservations` | Claim ticket slot from pool |
| GET | `/api/registrations/me` | My registrations |
| GET | `/api/events/:eventId/registrations` | Event attendees |
| POST | `/api/orders/:orderId/payments/midtrans` | Create Midtrans payment transaction |
| POST | `/api/payments/midtrans/webhook` | Midtrans callback |
| GET | `/api/orders/:orderId` | Order and payment status |
| GET | `/api/tickets/:ticketId` | Ticket detail |
| POST | `/api/check-ins/validate` | Validate ticket |
| POST | `/api/check-ins` | Check-in ticket |
| GET | `/api/events/:eventId/check-ins` | Event check-ins |
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/events/:eventId/stats` | Event statistics |
| GET | `/api/events/:eventId/reports/registrations` | Registration report |
| GET | `/api/events/:eventId/reports/check-ins` | Check-in report |

---

## 6. Technical Notes

### Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (primary database)
- Redis (ticket slot pool + queue)
- BullMQ (async workers)
- Zod (request validation)
- dotenv (environment config)

### Suggested Libraries

| Library | Purpose |
| --- | --- |
| `bcrypt` or `argon2` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `helmet` | Security headers |
| `cors` | CORS configuration |
| `express-rate-limit` | Rate limiting sensitive endpoints |
| `nanoid` | Ticket code and QR token generation |
| `csv-stringify` | CSV export |
| `midtrans-client` | Midtrans Snap/Core integration |
| `nodemailer` or provider SDK | Email notification delivery |
| `bullmq` + `ioredis` | Redis slot pool, order queue, payment jobs, email jobs |

### Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://event_user:event_password@localhost:5432/event_management?schema=public"
REDIS_URL=redis://localhost:6379
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
PASSWORD_HASH_ROUNDS=12
TICKET_CODE_PREFIX=EVT
MIDTRANS_SERVER_KEY=change_me
MIDTRANS_CLIENT_KEY=change_me
MIDTRANS_IS_PRODUCTION=false
MAIL_FROM="Event Management <no-reply@example.com>"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=change_me
SMTP_PASS=change_me
QUEUE_CREATE_ORDER_NAME=create-order
QUEUE_EMAIL_NAME=email-notification
```

### Payment & Ticket Competition Rules

- Midtrans is the payment provider.
- For limited-capacity events, ticket competition uses a Redis slot pool.
- Each ticket slot has status: `available`, `held`, `sold`, `released`, `expired`.
- Slot claiming is atomic via Redis Lua script.
- After a slot is claimed, API enqueues a `create-order` job with `reservationId` as idempotency key.
- `create-order` worker creates a pending order, initializes Midtrans payment, and stores payment metadata.
- Reservation endpoint returns `reservationId`/`jobId`; frontend polls order status.
- Digital tickets are issued only after successful Midtrans payment callback.
- Failed/expired payments cancel the order and release slot state.
- Primary DB remains source of truth for order, payment, ticket, and slot audit.
- One user cannot hold more than one active registration for the same event.

### Email Notification Rules

- Send order-created email when pending order is created.
- Send payment-success email after successful webhook processing.
- Send e-ticket email after ticket issuance.
- Send payment-failed/expired email on failure or timeout.
- Email sending must be asynchronous via queue.
- Email failure must not roll back order/ticket state; log failure for retries.
