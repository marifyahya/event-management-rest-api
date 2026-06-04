# Event Management REST API Epics

This document contains epic breakdown and implementation subtasks for the Event Management REST API.

---

## Epic Breakdown

| Epic | Name | Outcome |
| --- | --- | --- |
| Epic 1 | Setup & Authentication | Secure API with user login and role access |
| Epic 2 | Event Management | Organizer can manage event lifecycle |
| Epic 3 | Order, Payment & Ticketing | Attendees can order, pay via Midtrans, and receive tickets |
| Epic 4 | Check-in & Validation | Staff can validate and check in tickets |
| Epic 5 | Dashboard & Reporting | Organizer can view metrics and reports |

---

## Subtasks per Epic

> Tasks are intentionally small and target roughly 25 minutes each.

### Epic 1: Setup & Authentication

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

### Epic 2: Event Management

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

### Epic 3: Order, Payment & Ticketing

- [x] [Database] Create `orders` table for event payment state
- [x] [Database] Create `payments` table for Midtrans transactions
- [x] [Database] Create `tickets` table
- [x] [Integration] Setup Redis connection (`src/libs/redis.ts`)
- [x] [Integration] Setup BullMQ `create-payment` and `order-expire` queues
- [x] [Integration] `create-payment` worker: process Midtrans transaction
- [x] [Integration] `order-expire` worker: handle order expiry and release stock
- [x] [Backend] Create `order-status` constants
- [x] [Backend] Create `payment-status` constants
- [x] [Backend] `POST /api/orders`: synchronous order creation and enqueue workers
- [x] [Integration] `GET /api/orders/:orderId`: order/payment polling endpoint
- [ ] [Integration] `POST /api/webhooks/midtrans`: process callback and update order
- [ ] [Backend] Issue digital ticket only after successful payment
- [ ] [Backend] `GET /api/tickets/:ticketId`: ticket detail

### Epic 4: Check-in & Validation

- [ ] [Database] Create `check_ins` table with relation to organizer
- [ ] [Backend] `POST /api/admin/check-ins/validate`: validate ticket code/QR token
- [ ] [Backend] `POST /api/admin/check-ins`: check-in valid ticket (with duplicate prevention)
- [ ] [Backend] `GET /api/admin/events/:eventId/check-ins`: event check-in list
- [ ] [Backend] `GET /api/admin/check-ins/:checkInId`: check-in detail
- [ ] [Integration] Restrict check-in access to organizer/staff/admin

### Epic 5: Dashboard & Reporting

- [ ] [Database] Ensure aggregation-friendly indexes/relations for events, tickets, payments, check-ins
- [ ] [Backend] `GET /api/admin/dashboard/summary`: total events/tickets/check-ins
- [ ] [Backend] `GET /api/admin/events/:eventId/stats`: event statistics
- [ ] [Backend] `GET /api/admin/events/:eventId/reports/attendees`: attendee report
- [ ] [Backend] `GET /api/admin/events/:eventId/reports/check-ins`: check-in report
- [ ] [Integration] Add capacity and remaining quota aggregate query
- [ ] [Integration] Add date-based report filters
- [ ] [Backend] Add simple CSV export option
