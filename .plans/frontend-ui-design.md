# Event Management Frontend UI Design

Dokumen ini berisi rancangan UI frontend untuk aplikasi Event Management yang menggunakan Event Management REST API sebagai backend.

---

## 1. Design Goals

- Membuat pengalaman pengguna yang cepat untuk organizer dalam mengelola event, peserta, tiket, check-in, dan laporan.
- Memberikan alur registrasi event yang sederhana untuk attendee.
- Menyediakan dashboard yang mudah dipindai, padat informasi, dan cocok untuk pekerjaan operasional.
- Memastikan tampilan responsif untuk desktop, tablet, dan mobile.
- Mengurangi risiko kesalahan saat publish event, cancel event, dan check-in tiket.

---

## 2. Target Users

| User | Primary Needs | Main Screens |
| --- | --- | --- |
| Admin | Mengelola user, semua event, dan laporan global | Dashboard, Users, Events, Reports |
| Organizer | Membuat event, melihat peserta, check-in, laporan event | Dashboard, My Events, Event Detail, Check-in |
| Staff | Melakukan validasi tiket dan check-in peserta | Check-in Scanner, Check-in History |
| Attendee | Melihat event, daftar event, melihat tiket | Event Catalog, My Tickets, Registration Detail |

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
│   ├── My Registrations
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

- Left sidebar untuk navigasi utama.
- Top bar untuk search, user menu, dan quick action.
- Main content menggunakan layout tabel, form, dan dashboard metric.
- Sidebar dapat collapse agar ruang tabel lebih luas.

### Mobile Layout

- Bottom navigation untuk fitur utama attendee.
- Drawer menu untuk organizer/admin.
- Table berubah menjadi card list.
- Filter ditampilkan sebagai bottom sheet atau collapsible panel.

### Navigation Items by Role

| Role | Navigation |
| --- | --- |
| Admin | Dashboard, Users, Events, Reports, Settings |
| Organizer | Dashboard, My Events, Check-in, Reports |
| Staff | Check-in, Check-in History |
| Attendee | Browse Events, My Registrations, My Tickets, Profile |

---

## 5. Core Screens

### 5.1 Login

**Purpose:** User masuk ke aplikasi.

**UI Components:**

- Email input
- Password input
- Submit button
- Link ke Register
- Error alert untuk credential salah

**API:**

| Action | Endpoint |
| --- | --- |
| Login | `POST /api/auth/login` |
| Get profile after login | `GET /api/auth/me` |

**States:**

- Empty form
- Loading submit
- Validation error
- Invalid credential
- Success redirect by role

---

### 5.2 Register

**Purpose:** Attendee atau organizer membuat akun baru.

**UI Components:**

- Full name input
- Email input
- Password input
- Role selector jika diizinkan
- Submit button

**API:**

| Action | Endpoint |
| --- | --- |
| Register | `POST /api/auth/register` |

**States:**

- Field validation
- Email already used
- Loading
- Success redirect to login or dashboard

---

### 5.3 Event Catalog

**Purpose:** Attendee melihat event yang tersedia.

**UI Components:**

- Search input
- Filter by category
- Filter by date
- Event list/card
- Pagination
- Empty state

**Event Card Content:**

- Event title
- Category
- Date and time
- Location
- Remaining quota
- Status badge
- View detail button

**API:**

| Action | Endpoint |
| --- | --- |
| List events | `GET /api/events` |
| Event detail | `GET /api/events/:eventId` |

---

### 5.4 Event Detail

**Purpose:** User melihat detail event dan melakukan registrasi.

**UI Components:**

- Event title
- Date, location, category
- Capacity indicator
- Description
- Register button
- Cancelled/published status banner

**API:**

| Action | Endpoint |
| --- | --- |
| Get event detail | `GET /api/events/:eventId` |
| Register to event | `POST /api/events/:eventId/register` |

**States:**

- Event available
- Event full
- Already registered
- Event cancelled
- Registration success

---

### 5.5 Organizer Dashboard

**Purpose:** Organizer melihat ringkasan performa event.

**UI Components:**

- Metric cards: total events, registrations, tickets, check-ins
- Upcoming events table
- Recent registrations list
- Check-in progress chart
- Quick action: create event

**API:**

| Action | Endpoint |
| --- | --- |
| Dashboard summary | `GET /api/dashboard/summary` |
| Event stats | `GET /api/events/:eventId/stats` |

---

### 5.6 Event Management List

**Purpose:** Organizer mengelola event miliknya.

**UI Components:**

- Toolbar with create button
- Search input
- Status filter: draft, published, cancelled, archived
- Events table
- Row actions: view, edit, publish, cancel, archive

**Table Columns:**

| Column | Description |
| --- | --- |
| Title | Nama event |
| Status | Draft, Published, Cancelled, Archived |
| Date | Start date |
| Capacity | Kuota total |
| Registered | Jumlah peserta |
| Actions | View, Edit, Publish, Cancel |

**API:**

| Action | Endpoint |
| --- | --- |
| List events | `GET /api/events` |
| Delete/archive event | `DELETE /api/events/:eventId` |
| Publish event | `POST /api/events/:eventId/publish` |
| Cancel event | `POST /api/events/:eventId/cancel` |

---

### 5.7 Create/Edit Event Form

**Purpose:** Organizer membuat atau mengubah event.

**Form Fields:**

| Field | Type | Required |
| --- | --- | --- |
| Title | Text input | Yes |
| Description | Textarea | No |
| Category | Select/input | No |
| Location | Text input | Yes |
| Start date/time | Date time input | Yes |
| End date/time | Date time input | Yes |
| Capacity | Number input | Yes |
| Status | Read-only badge | No |

**Actions:**

- Save draft
- Update event
- Publish event
- Cancel editing

**API:**

| Action | Endpoint |
| --- | --- |
| Create event | `POST /api/events` |
| Update event | `PATCH /api/events/:eventId` |

---

### 5.8 Attendee Registrations

**Purpose:** Attendee melihat daftar event yang sudah didaftari.

**UI Components:**

- Registration list
- Status badge
- View ticket button
- Cancel registration button jika masih boleh

**API:**

| Action | Endpoint |
| --- | --- |
| My registrations | `GET /api/registrations/me` |
| Cancel registration | `POST /api/registrations/:registrationId/cancel` |

---

### 5.9 Ticket Detail

**Purpose:** Attendee melihat tiket digital.

**UI Components:**

- Ticket code
- QR code area
- Event title
- Date and location
- Ticket status
- Check-in status

**API:**

| Action | Endpoint |
| --- | --- |
| Ticket detail | `GET /api/tickets/:ticketId` |

---

### 5.10 Check-in Scanner

**Purpose:** Staff/organizer memvalidasi dan check-in tiket.

**UI Components:**

- QR scanner area
- Manual ticket code input
- Validate button
- Check-in button
- Result panel
- Recent check-ins list

**API:**

| Action | Endpoint |
| --- | --- |
| Validate ticket | `POST /api/check-ins/validate` |
| Check-in ticket | `POST /api/check-ins` |
| Event check-ins | `GET /api/events/:eventId/check-ins` |

**Result States:**

| State | UI Treatment |
| --- | --- |
| Valid | Green success panel with attendee and event detail |
| Already checked-in | Yellow warning panel |
| Cancelled/expired | Red danger panel |
| Not found | Red error panel |

---

### 5.11 Reports

**Purpose:** Organizer melihat dan mengunduh laporan peserta serta check-in.

**UI Components:**

- Date range filter
- Event selector
- Summary metrics
- Registrations table
- Check-ins table
- Export CSV button

**API:**

| Action | Endpoint |
| --- | --- |
| Registration report | `GET /api/events/:eventId/reports/registrations` |
| Check-in report | `GET /api/events/:eventId/reports/check-ins` |

---

## 6. Component Design

| Component | Usage |
| --- | --- |
| `AppShell` | Layout utama dengan sidebar/topbar |
| `RoleBasedNav` | Navigasi berdasarkan role user |
| `DataTable` | Tabel events, attendees, reports |
| `StatusBadge` | Status event, ticket, registration |
| `MetricCard` | Ringkasan angka dashboard |
| `EventForm` | Form create/edit event |
| `ConfirmDialog` | Publish, cancel, archive, cancel registration |
| `EmptyState` | Data kosong pada list/table |
| `LoadingState` | Skeleton atau spinner |
| `ErrorAlert` | Error API dan validation error |
| `TicketCard` | Tampilan tiket digital |
| `CheckInResultPanel` | Hasil validasi tiket |

---

## 7. Visual Style Guide

### Tone

- Clean
- Professional
- Operational
- Fast to scan

### Color Tokens

| Token | Hex | Usage |
| --- | --- | --- |
| `primary` | `#2563EB` | Primary action, active navigation |
| `success` | `#16A34A` | Valid ticket, published, checked-in |
| `warning` | `#D97706` | Draft, already checked-in, attention |
| `danger` | `#DC2626` | Cancelled, invalid, destructive action |
| `neutral-900` | `#111827` | Main text |
| `neutral-600` | `#4B5563` | Secondary text |
| `neutral-100` | `#F3F4F6` | Page background |
| `white` | `#FFFFFF` | Surface |

### Typography

| Element | Size | Weight |
| --- | --- | --- |
| Page title | 24px | 700 |
| Section title | 18px | 600 |
| Body text | 14px | 400 |
| Table text | 14px | 400 |
| Caption/helper | 12px | 400 |

### Spacing

| Token | Value |
| --- | --- |
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |

### Border Radius

- Buttons: 6px
- Inputs: 6px
- Cards: 8px maximum
- Dialogs: 8px

---

## 8. UX Rules

- Destructive actions seperti cancel event dan archive event wajib memakai confirmation dialog.
- Publish event harus menampilkan validation summary jika data event belum lengkap.
- Check-in harus menampilkan hasil validasi dengan warna dan pesan yang jelas.
- List besar wajib menggunakan pagination.
- Form harus menyimpan state loading dan disabled saat submit.
- Error backend harus diterjemahkan menjadi pesan yang bisa dipahami user.
- Empty state harus menjelaskan data yang kosong dan action berikutnya.
- Role attendee tidak boleh melihat menu organizer/admin.

---

## 9. Recommended Frontend Stack

| Area | Recommendation |
| --- | --- |
| Framework | React + Vite |
| Language | TypeScript |
| Routing | React Router |
| Server State | TanStack Query |
| Forms | React Hook Form |
| Validation | Zod |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| QR Display | `qrcode.react` |
| QR Scanner | `html5-qrcode` atau browser BarcodeDetector fallback |

---

## 10. Suggested Routes

| Route | Access | Screen |
| --- | --- | --- |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/events` | Public/User | Event Catalog |
| `/events/:eventId` | Public/User | Event Detail |
| `/dashboard` | Organizer/Admin | Dashboard |
| `/my-events` | Organizer | Event Management List |
| `/my-events/new` | Organizer | Create Event |
| `/my-events/:eventId/edit` | Organizer | Edit Event |
| `/my-events/:eventId/attendees` | Organizer | Attendees |
| `/check-in` | Staff/Organizer | Check-in Scanner |
| `/registrations` | Attendee | My Registrations |
| `/tickets/:ticketId` | Attendee | Ticket Detail |
| `/reports` | Organizer/Admin | Reports |
| `/users` | Admin | User Management |

---

## 11. API Error Handling

| API Error | UI Behavior |
| --- | --- |
| `400` Validation error | Show field-level errors if possible |
| `401` Unauthorized | Redirect to login |
| `403` Forbidden | Show access denied screen |
| `404` Not found | Show empty/not found state |
| `409` Conflict | Show warning, example: already registered |
| `500` Server error | Show generic error with retry button |

---

## 12. Frontend Implementation Tasks

- [ ] [Frontend] Setup React + TypeScript project structure (0.40 jam)
- [ ] [Frontend] Setup router and protected routes by role (0.40 jam)
- [ ] [Frontend] Build `AppShell` with sidebar and topbar (0.40 jam)
- [ ] [Frontend] Build login page connected to `POST /api/auth/login` (0.40 jam)
- [ ] [Frontend] Build register page connected to `POST /api/auth/register` (0.40 jam)
- [ ] [Frontend] Build event catalog connected to `GET /api/events` (0.40 jam)
- [ ] [Frontend] Build event detail and registration action (0.40 jam)
- [ ] [Frontend] Build organizer dashboard summary (0.40 jam)
- [ ] [Frontend] Build event list table with actions (0.40 jam)
- [ ] [Frontend] Build create/edit event form (0.40 jam)
- [ ] [Frontend] Build attendee registration list (0.33 jam)
- [ ] [Frontend] Build ticket detail with QR display (0.40 jam)
- [ ] [Frontend] Build check-in validation screen (0.40 jam)
- [ ] [Frontend] Build reports screen with filters (0.40 jam)
- [ ] [Frontend] Add loading, empty, and error states for all main screens (0.40 jam)
