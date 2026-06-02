# Event Management Frontend UI Design

This document describes the frontend UI plan for the Event Management application that uses Event Management REST API as backend.

---

## 1. Design Goals

- Deliver fast workflows for organizers to manage events, attendees, tickets, check-ins, and reports.
- Provide a simple event ordering flow for attendees.
- Build dashboards that are easy to scan and operationally useful.
- Ensure responsive behavior on desktop, tablet, and mobile.
- Reduce user mistakes during publish, cancel, and check-in actions.

---

## 2. Target Users

| User | Primary Needs | Main Screens |
| --- | --- | --- |
| Admin | Manage users, all events, and global reports | Dashboard, Users, Events, Reports |
| Organizer | Create events, view attendees, check-in, event reports | Dashboard, My Events, Event Detail, Check-in |
| Staff | Validate tickets and check in attendees | Check-in Scanner, Check-in History |
| Attendee | Browse events, register, and view tickets | Event Catalog, My Tickets, Registration Detail |

---

## 3. Information Architecture

```text
App
├── Public
│   ├── Login
│   ├── Register
│   └── Event Catalog
├── Attendee
│   ├── Event Detail
│   ├── My Orders
│   └── My Tickets
├── Organizer
│   ├── Dashboard
│   ├── Events
│   ├── Event Detail
│   ├── Attendees
│   ├── Check-in
│   └── Reports
└── Admin
    ├── Dashboard
    ├── Users
    ├── All Events
    └── Reports
```

---

## 4. Navigation Design

### Desktop Layout

- Left sidebar for primary navigation.
- Top bar for search, user menu, and quick actions.
- Main content in table/form/dashboard layout.
- Collapsible sidebar for wider data tables.

### Mobile Layout

- Bottom navigation for key attendee flows.
- Drawer menu for organizer/admin.
- Tables transformed into card lists.
- Filters shown as bottom sheet or collapsible panel.

### Navigation by Role

| Role | Navigation |
| --- | --- |
| Admin | Dashboard, Users, Events, Reports, Settings |
| Organizer | Dashboard, My Events, Check-in, Reports |
| Staff | Check-in, Check-in History |
| Attendee | Browse Events, My Orders, My Tickets, Profile |

---

## 5. Core Screens

### 5.1 Login

Purpose: user login.

Components:
- Email input
- Password input
- Submit button
- Register link
- Error alert for invalid credentials

API:
- `POST /api/auth/login`
- `GET /api/auth/me`

States:
- Empty
- Loading
- Validation error
- Invalid credentials
- Success redirect by role

### 5.2 Register

Purpose: attendee or organizer account creation.

Components:
- Full name
- Email
- Password
- Role selector (if allowed)
- Submit button

API:
- `POST /api/auth/register`

States:
- Field validation
- Email already used
- Loading
- Success redirect

### 5.3 Event Catalog

Purpose: attendee event discovery.

Components:
- Search input
- Category filter
- Date filter
- Event list/cards
- Pagination
- Empty state

Event card:
- Title, category, date/time, location
- Remaining quota
- Status badge
- Detail button

API:
- `GET /api/events`
- `GET /api/events/:eventId`

### 5.4 Event Detail

Purpose: view event details and register.

Components:
- Title
- Date/location/category
- Capacity indicator
- Description
- Register button
- Status banner (cancelled/published)

API:
- `GET /api/events/:eventId`
- `POST /api/events/:eventId/order`

States:
- Available
- Full
- Already registered
- Cancelled
- Registration success

### 5.5 Organizer Dashboard

Purpose: summarize event performance.

Components:
- Metric cards: total events, orders, tickets, check-ins
- Upcoming events table
- Recent orders list
- Check-in progress chart
- Quick action: create event

API:
- `GET /api/admin/dashboard/summary`
- `GET /api/admin/events/:eventId/stats`

### 5.6 Event Management List

Purpose: organizer event operations.

Components:
- Toolbar + create button
- Search
- Status filter (`draft`, `published`, `cancelled`, `archived`)
- Events table
- Row actions: view/edit/publish/cancel/archive

API:
- `GET /api/admin/events`
- `DELETE /api/admin/events/:eventId`
- `POST /api/admin/events/:eventId/publish`
- `POST /api/admin/events/:eventId/cancel`

### 5.7 Create/Edit Event Form

Purpose: create or update event data.

Fields:
- Title
- Description
- Category
- Location
- Start datetime
- End datetime
- Capacity

Validation:
- Required fields
- End time must be after start time
- Capacity must be positive

### 5.8 Check-in Scanner

Purpose: staff validates and checks in tickets quickly.

Components:
- Ticket code/QR input
- Validation result state
- Check-in action button
- Recent check-in history

API:
- `POST /api/admin/check-ins/validate`
- `POST /api/admin/check-ins`

### 5.9 Reports

Purpose: exportable operational summaries.

Components:
- Date range filter
- Event selector
- Registrations table
- Check-ins table
- Export CSV action

API:
- `GET /api/admin/events/:eventId/reports/attendees`
- `GET /api/admin/events/:eventId/reports/check-ins`

---

## 6. UI States & Patterns

### Standard States

- Loading (skeleton/spinner)
- Empty state
- Error state
- Success confirmation
- Permission denied

### Status Badge Mapping

| Status | Color |
| --- | --- |
| Draft | Gray |
| Published | Green |
| Cancelled | Red |
| Archived | Neutral |
| Pending Payment | Orange |
| Paid | Green |
| Failed/Expired | Red |

---

## 7. Accessibility & UX Rules

- Minimum color contrast for text and status badges.
- Full keyboard accessibility for forms and tables.
- Meaningful labels for all inputs.
- Clear feedback for destructive actions (cancel/archive/delete).
- Confirmation dialogs for high-impact actions.

---

## 8. Design System Guidelines

- Base spacing scale: `4, 8, 12, 16, 24, 32`.
- Max border radius for operational surfaces: `8px`.
- Dense, scan-friendly tables over card-heavy layouts for admin/organizer pages.
- Consistent button hierarchy: primary, secondary, destructive.
- Clear icon usage for action-heavy controls.

---

## 9. Implementation Notes

- Use role-aware route guards on frontend.
- Keep API errors mapped to consistent alert/toast patterns.
- Use optimistic UI carefully for non-critical updates.
- For payment/check-in flows, prefer explicit polling or websocket status feedback.
- Track key user actions for audit/debug (publish, cancel, archive, check-in).
