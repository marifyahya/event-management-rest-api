# Event Management REST API PRD

This document summarizes product requirements, database scope, minimum endpoints, timeline, and technical notes for the Event Management REST API.

---

## 1. Product Summary

### Background

Event organizers need a centralized backend system to manage events, attendees, tickets, check-ins, and reporting. Without a structured system, registration and ticket validation are prone to duplicate data, invalid tickets, and inaccurate reporting.

### Product Goals

- Provide a REST API to create, manage, and publish events.
- Support attendee order, Midtrans payments, and digital ticket issuance.
- Simplify check-in with ticket code or QR token validation.
- Provide basic dashboards and reports for organizers.
- Protect data with authentication, authorization, and request validation.

### User Personas

| Persona | Primary Needs | Pain Points |
| --- | --- | --- |
| Event Organizer | Create events, monitor attendees, view reports | Hard to track capacity and check-in status |
| Attendee | Order for events and receive tickets | Manual registration and poor ticket traceability |
| Admin | Manage users, events, and system access | Needs consistent data and access controls |

### Core Features

| Priority | Feature | Description |
| --- | --- | --- |
| High | Authentication & Authorization | Register, login, profile, role-based access |
| High | Event Management | Event CRUD, publish, cancel, filter, sort |
| High | Order & Ticketing | Event order, ticket generation, ticket view |
| High | Midtrans Payment | Create payment transactions, process webhooks, confirm tickets after success |
| Mid | Email Notifications | Send order, payment success/failure, and ticket emails |
| High | Check-in & Validation | Ticket validation and attendee check-in |
| Mid | Dashboard | Event, ticket, and check-in statistics |
| Mid | Reports | Attendee and check-in reports |
| Low | CSV Export | Export report data to CSV |

### Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | Simple API responses < 300ms, pagination for large lists |
| Security | Password hashing, JWT/session, RBAC, login rate limiting |
| Scalability | Domain-based module structure and migration-ready schema |
| Reliability | DB transactions for order, payment, ticketing, and check-in |
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
| Day 3 | Order & Ticketing | Order flow and ticket transactions |
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
| GET | `/api/events` | Public event list (published only) |
| GET | `/api/events/:eventId` | Public event detail (published only) |
| POST | `/api/events/:eventId/order` | Place order for event |
| GET | `/api/orders/:orderId` | Order and payment status |
| POST | `/api/payments/midtrans/webhook` | Midtrans callback |
| GET | `/api/tickets/:ticketId` | Ticket detail |
| POST | `/api/admin/events` | Create event |
| GET | `/api/admin/events` | List events with filters/pagination/sort |
| GET | `/api/admin/events/:eventId` | Event detail with organizer info |
| PATCH | `/api/admin/events/:eventId` | Update event |
| DELETE | `/api/admin/events/:eventId` | Delete/archive event by lifecycle rule |
| POST | `/api/admin/events/:eventId/publish` | Publish event |
| POST | `/api/admin/events/:eventId/cancel` | Cancel event |
| POST | `/api/admin/events/:eventId/archive` | Archive event |
| POST | `/api/admin/events/:eventId/move-to-draft` | Move cancelled event to draft |
| POST | `/api/admin/check-ins/validate` | Validate ticket |
| POST | `/api/admin/check-ins` | Check-in ticket |
| GET | `/api/admin/events/:eventId/check-ins` | Event check-ins |
| GET | `/api/admin/dashboard/summary` | Dashboard summary |
| GET | `/api/admin/events/:eventId/stats` | Event statistics |
| GET | `/api/admin/events/:eventId/reports/attendees` | Attendee report |
| GET | `/api/admin/events/:eventId/reports/check-ins` | Check-in report |

---

## 6. Technical Notes

### Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (primary database)
- Redis (job queue)
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
| `bullmq` + `ioredis` | Order queue, payment jobs, email jobs |

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

### Payment & Order Flow Rules

- Midtrans is the payment provider.
- Attendee places an order for an event, which enqueues a `create-order` job.
- `create-order` worker creates a pending order and initializes a Midtrans payment.
- Order endpoint returns order details; frontend polls order status or uses Midtrans Snap redirect.
- Digital tickets are issued only after successful Midtrans payment callback.
- Failed/expired payments cancel the order.
- Primary DB remains source of truth for order, payment, and ticket state.
- One user cannot hold more than one active order for the same event.

### Email Notification Rules

- Send order-created email when pending order is created.
- Send payment-success email after successful webhook processing.
- Send e-ticket email after ticket issuance.
- Send payment-failed/expired email on failure or timeout.
- Email sending must be asynchronous via queue.
- Email failure must not roll back order/ticket state; log failure for retries.
