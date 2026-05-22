# Event Management REST API Epics

Dokumen ini berisi epic breakdown dan sub-task implementasi untuk Event Management REST API.

---

## Epic Breakdown 🧭

| Epic | Name | Outcome |
| --- | --- | --- |
| Epic 1 | Setup & Authentication | API aman dengan user login dan role |
| Epic 2 | Manajemen Event | Organizer dapat mengelola event |
| Epic 3 | Pendaftaran, Pembayaran & Tiket | Peserta dapat merebut kuota tiket, membayar via Midtrans, dan menerima tiket |
| Epic 4 | Check-in & Validasi | Staff dapat memvalidasi dan check-in tiket |
| Epic 5 | Dashboard & Laporan | Organizer dapat melihat statistik dan laporan |

---

## Sub-tasks per Epic ✅

> Setiap task dibuat kecil agar bisa dikerjakan maksimal sekitar 25 menit.

### Epic 1: Setup & Authentication

- [x] [Database] Migration schema user: tambahkan kolom `role`, `last_login_at`, dan timestamp user (0.33 jam)
- [x] [Backend] Endpoint `POST /api/auth/register`: buat validator request register (0.33 jam)
- [x] [Backend] Endpoint `POST /api/auth/register`: simpan self-register user baru sebagai `participant` dengan password hash (0.40 jam)
- [x] [Backend] Endpoint `POST /api/users`: admin membuat user `admin` atau `staff` dengan password hash (0.40 jam)
- [x] [Backend] Endpoint `GET /api/users`: admin list user dengan filter role, status, search, dan pagination (0.40 jam)
- [x] [Backend] Endpoint `GET /api/users/:userId`: admin melihat detail user (0.33 jam)
- [x] [Backend] Endpoint `PATCH /api/users/:userId`: admin update nama, role, status, atau password user (0.40 jam)
- [x] [Backend] Endpoint `DELETE /api/users/:userId`: admin deactivate user tanpa menghapus data historis (0.33 jam)
- [x] [Backend] Endpoint `POST /api/auth/login`: validasi credential dan return token (0.40 jam)
- [x] [Backend] Endpoint `GET /api/auth/me`: ambil profil user login (0.33 jam)
- [x] [Backend] Endpoint `POST /api/auth/logout`: buat response logout (0.25 jam)
- [x] [Integration] Buat middleware `requireAuth` (0.33 jam)
- [x] [Integration] Buat middleware `requireRole` (0.33 jam)

### Epic 2: Manajemen Event

- [x] [Database] Migration schema event: buat table `events` (0.40 jam)
- [x] [Backend] Endpoint `POST /api/events`: create event draft (0.40 jam)
- [x] [Backend] Endpoint `GET /api/events`: list event dengan filter dan pagination (0.40 jam)
- [x] [Backend] Endpoint `GET /api/events/:eventId`: detail event (0.33 jam)
- [x] [Backend] Endpoint `PATCH /api/events/:eventId`: update event (0.40 jam)
- [x] [Backend] Endpoint `DELETE /api/events/:eventId`: archive event (0.33 jam)
- [x] [Backend] Endpoint `POST /api/events/:eventId/publish`: publish event (0.25 jam)
- [x] [Backend] Endpoint `POST /api/events/:eventId/cancel`: cancel event (0.33 jam)

Status catatan saat ini:

- Lifecycle endpoint yang sudah tersedia:
  - `POST /api/events/:id/publish`
  - `POST /api/events/:id/cancel`
  - `POST /api/events/:id/archive`
  - `POST /api/events/:id/move-to-draft`
  - `DELETE /api/events/:id` (soft delete via `deletedAt`, hanya untuk status `archived`)
- Scope saat ini belum mencakup ownership-based authorization per organizer.

### Epic 3: Pendaftaran, Pembayaran & Tiket

- [ ] [Database] Migration schema registrasi dan tiket: buat table `registrations` (0.33 jam)
- [ ] [Database] Migration schema registrasi dan tiket: buat table `tickets` (0.40 jam)
- [ ] [Database] Migration schema pembayaran: buat table `orders` untuk status pembayaran tiket event (0.40 jam)
- [ ] [Database] Migration schema pembayaran: buat table `payments` untuk data transaksi Midtrans (0.40 jam)
- [ ] [Database] Migration schema slot tiket: buat table `ticket_slots` sebagai audit/final mirror slot tiket (0.40 jam)
- [ ] [Integration] Setup Redis slot pool untuk tiket event terbatas (0.40 jam)
- [ ] [Backend] Endpoint `POST /api/events/:eventId/ticket-reservations`: validasi event published dan kuota, claim slot tiket `available` secara atomik dengan Redis Lua script, lalu set slot menjadi `held` dengan `reservationId` dan expiry time (1.20 jam)
- [ ] [Integration] Setup queue `create-order` dengan BullMQ/Redis (0.40 jam)
- [ ] [Backend] Endpoint `POST /api/events/:eventId/register`: enqueue job create order setelah slot tiket berhasil diklaim (0.40 jam)
- [ ] [Integration] Worker `create-order`: buat order pending dan payment Midtrans (0.40 jam)
- [ ] [Integration] Endpoint `GET /api/orders/:orderId`: tampilkan status order/payment untuk polling frontend (0.33 jam)
- [ ] [Integration] Endpoint `POST /api/payments/midtrans/webhook`: proses callback Midtrans dan update order (0.40 jam)
- [ ] [Backend] Generate tiket digital hanya setelah pembayaran sukses (0.40 jam)
- [ ] [Backend] Endpoint `GET /api/registrations/me`: list registrasi user login (0.33 jam)
- [ ] [Backend] Endpoint `GET /api/events/:eventId/registrations`: list peserta event (0.40 jam)
- [ ] [Backend] Endpoint `GET /api/tickets/:ticketId`: detail tiket (0.33 jam)
- [ ] [Backend] Endpoint `POST /api/registrations/:registrationId/cancel`: cancel registrasi (0.40 jam)

### Epic 4: Check-in & Validasi

- [ ] [Database] Migration schema check-in: buat table `check_ins` (0.33 jam)
- [ ] [Backend] Endpoint `POST /api/check-ins/validate`: validasi ticket code atau QR token (0.40 jam)
- [ ] [Backend] Endpoint `POST /api/check-ins`: check-in tiket valid (0.40 jam)
- [ ] [Backend] Endpoint `POST /api/check-ins`: cegah check-in ganda (0.33 jam)
- [ ] [Backend] Endpoint `GET /api/events/:eventId/check-ins`: list check-in event (0.40 jam)
- [ ] [Backend] Endpoint `GET /api/check-ins/:checkInId`: detail check-in (0.25 jam)
- [ ] [Integration] Batasi akses check-in untuk organizer, staff, atau admin (0.33 jam)

### Epic 5: Dashboard & Laporan

- [ ] [Database] Migration schema dashboard/laporan: pastikan index dan relasi agregasi untuk event, registrasi, tiket, pembayaran, dan check-in tersedia (0.40 jam)
- [ ] [Backend] Endpoint `GET /api/dashboard/summary`: ringkasan total event, registrasi, tiket, check-in (0.40 jam)
- [ ] [Backend] Endpoint `GET /api/events/:eventId/stats`: statistik event (0.40 jam)
- [ ] [Backend] Endpoint `GET /api/events/:eventId/reports/registrations`: laporan peserta (0.40 jam)
- [ ] [Backend] Endpoint `GET /api/events/:eventId/reports/check-ins`: laporan check-in (0.40 jam)
- [ ] [Integration] Tambahkan query agregasi kapasitas dan sisa kuota (0.33 jam)
- [ ] [Integration] Tambahkan filter laporan berdasarkan tanggal (0.33 jam)
- [ ] [Backend] Tambahkan opsi export CSV sederhana (0.40 jam)

---

## Draft API Contract 📌

> Semua response menggunakan format umum:
>
> ```json
> {
>   "success": true,
>   "message": "OK",
>   "data": {}
> }
> ```
>
> Error umum:
>
> ```json
> {
>   "success": false,
>   "message": "Validation error",
>   "errors": {
>     "field": ["Pesan error"]
>   }
> }
> ```
>
> Endpoint yang membutuhkan login memakai header `Authorization: Bearer <token>`.

### Epic 1: Authentication

#### `POST /api/auth/register`

Auth: public

Catatan: endpoint ini hanya untuk self-register participant. Role `admin` dan `staff` tidak boleh dibuat dari endpoint public.

Request:

```json
{
  "name": "Budi Organizer",
  "email": "budi@example.com",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "User registered",
  "data": {
    "user": {
      "id": "usr_123",
      "name": "Budi Organizer",
      "email": "budi@example.com",
      "role": "participant",
      "createdAt": "2026-05-18T10:00:00.000Z"
    },
    "token": "jwt_token"
  }
}
```

#### `POST /api/users`

Auth: admin

Catatan: hanya user dengan role `admin` yang boleh membuat user internal. Role yang boleh dibuat dari endpoint ini adalah `admin` dan `staff`.

Request:

```json
{
  "name": "Staff Check-in",
  "email": "staff@example.com",
  "password": "secret123",
  "role": "staff"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "User created",
  "data": {
    "user": {
      "id": "usr_staff_123",
      "name": "Staff Check-in",
      "email": "staff@example.com",
      "role": "staff",
      "isActive": true,
      "createdAt": "2026-05-19T10:00:00.000Z"
    }
  }
}
```

Error `403` jika bukan admin:

```json
{
  "success": false,
  "message": "Only admin can create admin or staff users"
}
```

Error `422` jika role bukan `admin` atau `staff`:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "role": ["Role must be admin or staff"]
  }
}
```

#### `GET /api/users`

Auth: admin

Query:

```text
?page=1&limit=20&role=staff&isActive=true&search=check
```

Response `200`:

```json
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "items": [
      {
        "id": "usr_staff_123",
        "name": "Staff Check-in",
        "email": "staff@example.com",
        "role": "staff",
        "isActive": true,
        "lastLoginAt": null,
        "createdAt": "2026-05-19T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/users/:userId`

Auth: admin

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "User retrieved",
  "data": {
    "user": {
      "id": "usr_staff_123",
      "name": "Staff Check-in",
      "email": "staff@example.com",
      "role": "staff",
      "isActive": true,
      "lastLoginAt": null,
      "createdAt": "2026-05-19T10:00:00.000Z",
      "updatedAt": "2026-05-19T10:00:00.000Z"
    }
  }
}
```

#### `PATCH /api/users/:userId`

Auth: admin

Catatan: admin boleh mengubah user internal dan status aktif user. Jika `password` dikirim, password harus di-hash ulang. Role yang valid: `participant`, `organizer`, `staff`, `admin`.

Request:

```json
{
  "name": "Staff Gate A",
  "role": "staff",
  "isActive": true,
  "password": "newsecret123"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "User updated",
  "data": {
    "user": {
      "id": "usr_staff_123",
      "name": "Staff Gate A",
      "email": "staff@example.com",
      "role": "staff",
      "isActive": true,
      "updatedAt": "2026-05-19T10:30:00.000Z"
    }
  }
}
```

#### `DELETE /api/users/:userId`

Auth: admin

Catatan: endpoint ini melakukan soft delete/deactivate dengan `isActive=false`, bukan hard delete, agar data event, order, ticket, dan check-in historis tetap aman.

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "User deactivated",
  "data": {
    "userId": "usr_staff_123",
    "isActive": false
  }
}
```

#### `POST /api/auth/login`

Auth: public

Request:

```json
{
  "email": "budi@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "usr_123",
      "name": "Budi Organizer",
      "email": "budi@example.com",
      "role": "organizer"
    },
    "token": "jwt_token"
  }
}
```

#### `GET /api/auth/me`

Auth: user login

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "user": {
      "id": "usr_123",
      "name": "Budi Organizer",
      "email": "budi@example.com",
      "role": "organizer",
      "lastLoginAt": "2026-05-18T10:00:00.000Z"
    }
  }
}
```

#### `POST /api/auth/logout`

Auth: user login

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

### Epic 2: Manajemen Event

#### `POST /api/events`

Auth: organizer/admin

Request:

```json
{
  "title": "Tech Conference Jakarta 2026",
  "description": "Konferensi teknologi untuk developer dan startup.",
  "location": "Jakarta Convention Center",
  "startAt": "2026-08-20T09:00:00.000Z",
  "endAt": "2026-08-20T17:00:00.000Z",
  "capacity": 500,
  "ticketPrice": 150000
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Event created",
  "data": {
    "event": {
      "id": "evt_123",
      "title": "Tech Conference Jakarta 2026",
      "status": "draft",
      "capacity": 500,
      "ticketPrice": 150000,
      "organizerId": "usr_123",
      "createdAt": "2026-05-18T10:00:00.000Z"
    }
  }
}
```

#### `GET /api/events`

Auth: public untuk event published, organizer/admin untuk data milik sendiri

Query:

```text
?page=1&limit=10&status=published&search=conference&startDate=2026-08-01&endDate=2026-08-31
```

Response `200`:

```json
{
  "success": true,
  "message": "Events retrieved",
  "data": {
    "items": [
      {
        "id": "evt_123",
        "title": "Tech Conference Jakarta 2026",
        "status": "published",
        "location": "Jakarta Convention Center",
        "startAt": "2026-08-20T09:00:00.000Z",
        "capacity": 500,
        "remainingQuota": 250
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/events/:eventId`

Auth: public untuk event published, organizer/admin untuk draft milik sendiri

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Event retrieved",
  "data": {
    "event": {
      "id": "evt_123",
      "title": "Tech Conference Jakarta 2026",
      "description": "Konferensi teknologi untuk developer dan startup.",
      "status": "published",
      "location": "Jakarta Convention Center",
      "startAt": "2026-08-20T09:00:00.000Z",
      "endAt": "2026-08-20T17:00:00.000Z",
      "capacity": 500,
      "remainingQuota": 250,
      "ticketPrice": 150000
    }
  }
}
```

#### `PATCH /api/events/:eventId`

Auth: organizer owner/admin

Request:

```json
{
  "title": "Tech Conference Jakarta 2026 Updated",
  "description": "Deskripsi terbaru.",
  "location": "Balai Kartini Jakarta",
  "capacity": 600,
  "ticketPrice": 175000
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Event updated",
  "data": {
    "event": {
      "id": "evt_123",
      "title": "Tech Conference Jakarta 2026 Updated",
      "status": "draft",
      "capacity": 600,
      "ticketPrice": 175000,
      "updatedAt": "2026-05-18T10:10:00.000Z"
    }
  }
}
```

#### `DELETE /api/events/:eventId`

Auth: organizer owner/admin

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Event archived",
  "data": {
    "eventId": "evt_123",
    "status": "archived"
  }
}
```

#### `POST /api/events/:eventId/publish`

Auth: organizer owner/admin

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Event published",
  "data": {
    "eventId": "evt_123",
    "status": "published",
    "publishedAt": "2026-05-18T10:15:00.000Z"
  }
}
```

#### `POST /api/events/:eventId/cancel`

Auth: organizer owner/admin

Request:

```json
{
  "reason": "Venue tidak tersedia"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Event canceled",
  "data": {
    "eventId": "evt_123",
    "status": "canceled",
    "canceledReason": "Venue tidak tersedia"
  }
}
```

### Epic 3: Pendaftaran, Pembayaran & Tiket

#### `POST /api/events/:eventId/ticket-reservations`

Auth: participant

Request:

```json
{
  "quantity": 2
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Ticket slot reserved",
  "data": {
    "reservation": {
      "id": "rsv_123",
      "eventId": "evt_123",
      "quantity": 2,
      "status": "held",
      "expiresAt": "2026-05-18T10:15:00.000Z"
    }
  }
}
```

#### `POST /api/events/:eventId/register`

Auth: participant

Request:

```json
{
  "reservationId": "rsv_123",
  "attendees": [
    {
      "name": "Ani",
      "email": "ani@example.com"
    },
    {
      "name": "Budi",
      "email": "budi@example.com"
    }
  ]
}
```

Response `202`:

```json
{
  "success": true,
  "message": "Registration is being processed",
  "data": {
    "registrationId": "reg_123",
    "orderId": "ord_123",
    "status": "processing"
  }
}
```

#### `GET /api/orders/:orderId`

Auth: participant owner, organizer owner, atau admin

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Order retrieved",
  "data": {
    "order": {
      "id": "ord_123",
      "registrationId": "reg_123",
      "status": "pending_payment",
      "amount": 300000,
      "payment": {
        "id": "pay_123",
        "provider": "midtrans",
        "status": "pending",
        "redirectUrl": "https://app.midtrans.com/snap/v2/vtweb/token"
      }
    }
  }
}
```

#### `POST /api/payments/midtrans/webhook`

Auth: Midtrans signature verification

Request:

```json
{
  "order_id": "ord_123",
  "transaction_id": "midtrans_tx_123",
  "transaction_status": "settlement",
  "payment_type": "bank_transfer",
  "gross_amount": "300000.00",
  "signature_key": "midtrans_signature"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Webhook processed",
  "data": {
    "orderId": "ord_123",
    "orderStatus": "paid",
    "paymentStatus": "settlement"
  }
}
```

#### `GET /api/registrations/me`

Auth: participant

Query:

```text
?page=1&limit=10&status=paid
```

Response `200`:

```json
{
  "success": true,
  "message": "Registrations retrieved",
  "data": {
    "items": [
      {
        "id": "reg_123",
        "eventId": "evt_123",
        "eventTitle": "Tech Conference Jakarta 2026",
        "status": "paid",
        "ticketCount": 2,
        "createdAt": "2026-05-18T10:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/events/:eventId/registrations`

Auth: organizer owner/admin

Query:

```text
?page=1&limit=20&status=paid&search=ani
```

Response `200`:

```json
{
  "success": true,
  "message": "Event registrations retrieved",
  "data": {
    "items": [
      {
        "id": "reg_123",
        "participantName": "Ani",
        "participantEmail": "ani@example.com",
        "status": "paid",
        "ticketCount": 2,
        "paidAt": "2026-05-18T10:25:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/tickets/:ticketId`

Auth: ticket owner, organizer owner, staff, atau admin

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Ticket retrieved",
  "data": {
    "ticket": {
      "id": "tkt_123",
      "eventId": "evt_123",
      "registrationId": "reg_123",
      "attendeeName": "Ani",
      "attendeeEmail": "ani@example.com",
      "status": "active",
      "ticketCode": "EVT123-ANI-001",
      "qrToken": "signed_qr_token"
    }
  }
}
```

#### `POST /api/registrations/:registrationId/cancel`

Auth: participant owner, organizer owner, atau admin

Request:

```json
{
  "reason": "Tidak bisa hadir"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Registration canceled",
  "data": {
    "registrationId": "reg_123",
    "status": "canceled"
  }
}
```

### Epic 4: Check-in & Validasi

#### `POST /api/check-ins/validate`

Auth: organizer owner, staff, atau admin

Request:

```json
{
  "eventId": "evt_123",
  "ticketCode": "EVT123-ANI-001",
  "qrToken": "signed_qr_token"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Ticket is valid",
  "data": {
    "valid": true,
    "ticket": {
      "id": "tkt_123",
      "eventId": "evt_123",
      "attendeeName": "Ani",
      "status": "active",
      "checkedInAt": null
    }
  }
}
```

#### `POST /api/check-ins`

Auth: organizer owner, staff, atau admin

Request:

```json
{
  "eventId": "evt_123",
  "ticketId": "tkt_123",
  "ticketCode": "EVT123-ANI-001",
  "qrToken": "signed_qr_token"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Ticket checked in",
  "data": {
    "checkIn": {
      "id": "chk_123",
      "eventId": "evt_123",
      "ticketId": "tkt_123",
      "checkedInBy": "usr_staff_123",
      "checkedInAt": "2026-08-20T09:30:00.000Z"
    }
  }
}
```

#### `GET /api/events/:eventId/check-ins`

Auth: organizer owner, staff, atau admin

Query:

```text
?page=1&limit=20&search=ani&startDate=2026-08-20&endDate=2026-08-20
```

Response `200`:

```json
{
  "success": true,
  "message": "Check-ins retrieved",
  "data": {
    "items": [
      {
        "id": "chk_123",
        "ticketId": "tkt_123",
        "attendeeName": "Ani",
        "checkedInBy": "Staff Event",
        "checkedInAt": "2026-08-20T09:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/check-ins/:checkInId`

Auth: organizer owner, staff, atau admin

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Check-in retrieved",
  "data": {
    "checkIn": {
      "id": "chk_123",
      "eventId": "evt_123",
      "ticketId": "tkt_123",
      "attendeeName": "Ani",
      "checkedInBy": "Staff Event",
      "checkedInAt": "2026-08-20T09:30:00.000Z"
    }
  }
}
```

### Epic 5: Dashboard & Laporan

#### `GET /api/dashboard/summary`

Auth: organizer/admin

Query:

```text
?startDate=2026-08-01&endDate=2026-08-31
```

Response `200`:

```json
{
  "success": true,
  "message": "Dashboard summary retrieved",
  "data": {
    "totalEvents": 5,
    "totalRegistrations": 1200,
    "totalTickets": 1500,
    "totalCheckIns": 900,
    "totalRevenue": 225000000
  }
}
```

#### `GET /api/events/:eventId/stats`

Auth: organizer owner/admin

Request: tidak ada body

Response `200`:

```json
{
  "success": true,
  "message": "Event stats retrieved",
  "data": {
    "eventId": "evt_123",
    "capacity": 500,
    "reservedSlots": 10,
    "paidTickets": 350,
    "remainingQuota": 140,
    "checkIns": 250,
    "revenue": 52500000
  }
}
```

#### `GET /api/events/:eventId/reports/registrations`

Auth: organizer owner/admin

Query:

```text
?startDate=2026-08-01&endDate=2026-08-31&format=json
```

Response `200`:

```json
{
  "success": true,
  "message": "Registration report retrieved",
  "data": {
    "items": [
      {
        "registrationId": "reg_123",
        "participantName": "Ani",
        "participantEmail": "ani@example.com",
        "ticketCount": 2,
        "status": "paid",
        "amount": 300000,
        "registeredAt": "2026-05-18T10:20:00.000Z"
      }
    ]
  }
}
```

#### `GET /api/events/:eventId/reports/check-ins`

Auth: organizer owner/admin

Query:

```text
?startDate=2026-08-20&endDate=2026-08-20&format=json
```

Response `200`:

```json
{
  "success": true,
  "message": "Check-in report retrieved",
  "data": {
    "items": [
      {
        "checkInId": "chk_123",
        "ticketId": "tkt_123",
        "attendeeName": "Ani",
        "attendeeEmail": "ani@example.com",
        "checkedInBy": "Staff Event",
        "checkedInAt": "2026-08-20T09:30:00.000Z"
      }
    ]
  }
}
```
