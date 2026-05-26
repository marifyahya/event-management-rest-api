# Event Management REST API Epics

This document contains epic breakdown and implementation subtasks for the Event Management REST API.

---

## Epic Breakdown

| Epic | Name | Outcome |
| --- | --- | --- |
| Epic 1 | Setup & Authentication | Secure API with user login and role access |
| Epic 2 | Event Management | Organizer can manage event lifecycle |
| Epic 3 | Registration, Payment & Ticketing | Attendees can reserve quota, pay via Midtrans, and receive tickets |
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
- [x] [Backend] `POST /api/events`: create draft event
- [x] [Backend] `GET /api/events`: list events with filters/pagination
- [x] [Backend] `GET /api/events/:eventId`: event detail
- [x] [Backend] `PATCH /api/events/:eventId`: update event
- [x] [Backend] `DELETE /api/events/:eventId`: lifecycle-controlled delete
- [x] [Backend] `POST /api/events/:eventId/publish`: publish event
- [x] [Backend] `POST /api/events/:eventId/cancel`: cancel event

Current lifecycle endpoints:

- `POST /api/events/:id/publish`
- `POST /api/events/:id/cancel`
- `POST /api/events/:id/archive`
- `POST /api/events/:id/move-to-draft`
- `DELETE /api/events/:id` (soft delete via `deletedAt`, only for `archived` events)

Current scope note:

- Ownership-based authorization (organizer-level ownership checks) is intentionally out of scope for now.

### Epic 3: Registration, Payment & Ticketing

- [ ] [Database] Create `registrations` table
- [ ] [Database] Create `tickets` table
- [ ] [Database] Create `orders` table for event payment state
- [ ] [Database] Create `payments` table for Midtrans transactions
- [ ] [Integration] Setup Redis ticket slot pool (counter + reservation with TTL, no DB mirror)
- [ ] [Backend] `POST /api/events/:eventId/ticket-reservations`: validate published event/quota, atomic `DECR` slot counter in Redis, set reservation hash with TTL
- [ ] [Integration] Setup BullMQ `create-order` queue
- [ ] [Backend] `POST /api/events/:eventId/register`: enqueue create-order job after slot claim
- [ ] [Integration] `create-order` worker: create pending order + Midtrans payment
- [ ] [Integration] `GET /api/orders/:orderId`: order/payment polling endpoint
- [ ] [Integration] `POST /api/payments/midtrans/webhook`: process callback and update order
- [ ] [Backend] Issue digital ticket only after successful payment
- [ ] [Backend] `GET /api/registrations/me`: current user registrations
- [ ] [Backend] `GET /api/events/:eventId/registrations`: event participants list
- [ ] [Backend] `GET /api/tickets/:ticketId`: ticket detail
- [ ] [Backend] `POST /api/registrations/:registrationId/cancel`: cancel registration

### Epic 4: Check-in & Validation

- [ ] [Database] Create `check_ins` table
- [ ] [Backend] `POST /api/check-ins/validate`: validate ticket code/QR token
- [ ] [Backend] `POST /api/check-ins`: check-in valid ticket
- [ ] [Backend] `POST /api/check-ins`: prevent duplicate check-in
- [ ] [Backend] `GET /api/events/:eventId/check-ins`: event check-in list
- [ ] [Backend] `GET /api/check-ins/:checkInId`: check-in detail
- [ ] [Integration] Restrict check-in access to organizer/staff/admin

### Epic 5: Dashboard & Reporting

- [ ] [Database] Ensure aggregation-friendly indexes/relations for events, registrations, tickets, payments, check-ins
- [ ] [Backend] `GET /api/dashboard/summary`: total events/registrations/tickets/check-ins
- [ ] [Backend] `GET /api/events/:eventId/stats`: event statistics
- [ ] [Backend] `GET /api/events/:eventId/reports/registrations`: attendee report
- [ ] [Backend] `GET /api/events/:eventId/reports/check-ins`: check-in report
- [ ] [Integration] Add capacity and remaining quota aggregate query
- [ ] [Integration] Add date-based report filters
- [ ] [Backend] Add simple CSV export option
