# Event Management REST API Database Schema

Dokumen ini berisi rancangan schema database untuk Event Management REST API.

---

## Entity Relationship Overview

```text
users 1--N events
users 1--N registrations
users 1--N orders
events 1--N registrations
events 1--N ticket_slots
events 1--N orders
registrations 1--1 tickets
events 1--N tickets
orders 1--1 payments
orders 1--N tickets
ticket_slots 1--0..1 tickets
tickets 1--0..1 check_ins
users 1--N check_ins
```

---

## `users`

Menyimpan data akun untuk admin, organizer, staff, dan attendee.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | User ID |
| `full_name` | text | not null | Nama lengkap user |
| `email` | text | not null, unique | Email login |
| `password` | text | not null | Password hash |
| `role` | text | not null, default `attendee` | `admin`, `organizer`, `staff`, `attendee` |
| `is_active` | boolean | default true | Status akun |
| `last_login_at` | timestamp | nullable | Waktu login terakhir |
| `created_at` | timestamp | not null | Waktu dibuat |
| `updated_at` | timestamp | not null | Waktu update terakhir |

---

## `events`

Menyimpan data event yang dibuat oleh organizer.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | Event ID |
| `organizer_id` | integer | FK `users.id`, not null | Pemilik event |
| `title` | text | not null | Judul event |
| `description` | text | nullable | Deskripsi event |
| `category` | text | nullable | Kategori event |
| `location` | text | not null | Lokasi event |
| `start_at` | timestamp | not null | Waktu mulai |
| `end_at` | timestamp | not null | Waktu selesai |
| `capacity` | integer | not null | Kuota peserta |
| `status` | text | not null, default `draft` | `draft`, `published`, `cancelled`, `archived` |
| `cancel_reason` | text | nullable | Alasan pembatalan |
| `published_at` | timestamp | nullable | Waktu publish |
| `created_at` | timestamp | not null | Waktu dibuat |
| `updated_at` | timestamp | not null | Waktu update terakhir |

---

## `registrations`

Menyimpan pendaftaran user ke event.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | Registration ID |
| `event_id` | integer | FK `events.id`, not null | Event yang didaftari |
| `user_id` | integer | FK `users.id`, not null | Peserta yang mendaftar |
| `status` | text | not null, default `registered` | `registered`, `cancelled`, `checked_in` |
| `registered_at` | timestamp | not null | Waktu registrasi |
| `cancelled_at` | timestamp | nullable | Waktu pembatalan |
| `created_at` | timestamp | not null | Waktu dibuat |
| `updated_at` | timestamp | not null | Waktu update terakhir |

Recommended constraint:

- Unique index: `event_id + user_id` untuk mencegah user mendaftar event yang sama lebih dari sekali.

---

## `ticket_slots`

Menyimpan audit/final mirror dari slot pool tiket terbatas per event. Perebutan tiket dilakukan di Redis, sedangkan database utama menyimpan status final untuk order, payment, ticket, dan rekonsiliasi.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | Slot ID |
| `event_id` | integer | FK `events.id`, not null | Event terkait |
| `slot_code` | text | not null | Kode slot internal, contoh `EVT-1-0001` |
| `status` | text | not null, default `available` | `available`, `held`, `sold`, `released`, `expired` |
| `reservation_id` | text/uuid | nullable | ID reservasi saat slot di-hold |
| `order_id` | text/uuid | FK `orders.id`, nullable | Order terkait setelah worker berjalan |
| `user_id` | integer | FK `users.id`, nullable | User yang mengklaim slot |
| `held_until` | timestamp | nullable | Batas waktu hold slot |
| `sold_at` | timestamp | nullable | Waktu slot menjadi sold |
| `created_at` | timestamp | not null | Waktu dibuat |
| `updated_at` | timestamp | not null | Waktu update terakhir |

Recommended constraints:

- Unique index: `event_id + slot_code`
- Partial index: `event_id + status`
- Partial unique index opsional: `reservation_id + id` untuk idempotency
- Saat user berebut tiket, gunakan Redis Lua script untuk mengambil slot `available` secara atomik.

---

## `orders`

Menyimpan order pembelian tiket event. Order dibuat oleh worker queue setelah slot tiket berhasil diklaim.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | text/uuid | PK | Order ID |
| `order_number` | text | not null, unique | Nomor order human-readable |
| `event_id` | integer | FK `events.id`, not null | Event terkait |
| `user_id` | integer | FK `users.id`, not null | Pembeli |
| `registration_id` | integer | FK `registrations.id`, nullable | Registration setelah order dibuat |
| `status` | text | not null, default `pending` | `pending`, `paid`, `failed`, `expired`, `cancelled` |
| `reservation_id` | text/uuid | nullable, unique | ID reservasi/job awal dari queue |
| `job_id` | text | nullable | ID job queue create-order |
| `quantity` | integer | not null, default 1 | Jumlah tiket dalam order |
| `subtotal_amount` | integer | not null | Harga tiket sebelum fee |
| `admin_fee` | integer | not null, default 0 | Biaya admin |
| `total_amount` | integer | not null | Total pembayaran |
| `expires_at` | timestamp | nullable | Batas pembayaran |
| `paid_at` | timestamp | nullable | Waktu pembayaran sukses |
| `created_at` | timestamp | not null | Waktu dibuat |
| `updated_at` | timestamp | not null | Waktu update terakhir |

---

## `payments`

Menyimpan transaksi pembayaran Midtrans.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | text/uuid | PK | Payment ID |
| `order_id` | text/uuid | FK `orders.id`, unique, not null | Order terkait |
| `provider` | text | not null, default `midtrans` | Payment provider |
| `provider_order_id` | text | not null, unique | Order ID yang dikirim ke Midtrans |
| `provider_transaction_id` | text | nullable | Transaction ID dari Midtrans |
| `payment_type` | text | nullable | VA, QRIS, card, dll |
| `status` | text | not null, default `pending` | `pending`, `settlement`, `capture`, `deny`, `cancel`, `expire`, `failure` |
| `gross_amount` | integer | not null | Nominal pembayaran |
| `snap_token` | text | nullable | Token Snap Midtrans |
| `snap_redirect_url` | text | nullable | Redirect URL Snap Midtrans |
| `raw_notification` | jsonb | nullable | Payload webhook terakhir |
| `paid_at` | timestamp | nullable | Waktu pembayaran sukses |
| `created_at` | timestamp | not null | Waktu dibuat |
| `updated_at` | timestamp | not null | Waktu update terakhir |

---

## `tickets`

Menyimpan tiket digital yang diterbitkan setelah pembayaran sukses.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | Ticket ID |
| `registration_id` | integer | FK `registrations.id`, unique, not null | Registration terkait |
| `order_id` | text/uuid | FK `orders.id`, nullable | Order pembayaran terkait |
| `slot_id` | integer | FK `ticket_slots.id`, unique, not null | Slot tiket yang menjadi tiket digital |
| `event_id` | integer | FK `events.id`, not null | Event terkait |
| `user_id` | integer | FK `users.id`, not null | Pemilik tiket |
| `ticket_code` | text | not null, unique | Kode tiket human-readable |
| `qr_token` | text | not null, unique | Token untuk QR validation |
| `status` | text | not null, default `active` | `active`, `cancelled`, `used`, `expired` |
| `issued_at` | timestamp | not null | Waktu tiket diterbitkan |
| `checked_in_at` | timestamp | nullable | Waktu check-in |
| `created_at` | timestamp | not null | Waktu dibuat |
| `updated_at` | timestamp | not null | Waktu update terakhir |

---

## `check_ins`

Menyimpan riwayat check-in tiket.

| Column | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | serial/integer | PK, auto increment | Check-in ID |
| `event_id` | integer | FK `events.id`, not null | Event terkait |
| `ticket_id` | integer | FK `tickets.id`, unique, not null | Tiket yang digunakan |
| `registration_id` | integer | FK `registrations.id`, not null | Registration terkait |
| `checked_by` | integer | FK `users.id`, not null | Staff/organizer yang melakukan check-in |
| `status` | text | not null, default `success` | `success`, `rejected` |
| `notes` | text | nullable | Catatan validasi |
| `checked_at` | timestamp | not null | Waktu check-in |
| `created_at` | timestamp | not null | Waktu dibuat |

---

## Recommended Indexes

| Table | Index | Purpose |
| --- | --- | --- |
| `users` | `email` | Login lookup |
| `events` | `organizer_id` | Query event milik organizer |
| `events` | `status` | Filter event published/draft |
| `events` | `start_at` | Sort dan filter berdasarkan tanggal |
| `registrations` | `event_id` | List peserta event |
| `registrations` | `user_id` | List registrasi user |
| `ticket_slots` | `event_id, status` | Claim slot tiket tersedia |
| `ticket_slots` | `reservation_id` | Lookup slot berdasarkan reservation |
| `ticket_slots` | `order_id` | Lookup slot berdasarkan order |
| `orders` | `event_id` | Query order per event |
| `orders` | `user_id` | Query order user |
| `orders` | `status` | Filter status order |
| `payments` | `provider_order_id` | Webhook Midtrans lookup |
| `payments` | `order_id` | Relasi payment ke order |
| `tickets` | `ticket_code` | Validasi tiket |
| `tickets` | `qr_token` | Validasi QR |
| `tickets` | `event_id` | Query tiket per event |
| `check_ins` | `event_id` | Laporan check-in event |
| `check_ins` | `checked_at` | Filter laporan berdasarkan tanggal |

---

## Prisma Schema Draft

Source of truth schema ada di `prisma/schema.prisma`. Model awal yang sudah dibuat untuk Epic 1:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id          Int       @id @default(autoincrement())
  fullName    String    @map("full_name")
  email       String    @unique
  password    String
  role        String    @default("participant")
  isActive    Boolean   @default(true) @map("is_active")
  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

Model untuk `Event`, `Registration`, `TicketSlot`, `Order`, `Payment`, `Ticket`, dan `CheckIn` ditambahkan bertahap di migration awal tiap epic sesuai checklist di `epics.md`.

---

## Redis Ticket Slot Pool & Queue Recommendation

Untuk skenario tiket terbatas yang diperebutkan banyak user, gunakan slot pool di Redis. Setiap tiket tersedia adalah satu slot ID dalam Redis. API mengklaim beberapa slot `available` secara atomik dengan Lua script, lalu queue membuat order dan payment secara asynchronous. Database utama tetap menjadi penyimpanan final untuk order, payment, ticket, dan audit slot.

Recommended Redis keys:

```text
event:{eventId}:slots:available      set/list slot ID tersedia
event:{eventId}:slots:held           set slot ID sedang di-hold
event:{eventId}:slots:sold           set slot ID sudah terjual
event:{eventId}:reservation:{id}     hash reservation detail
event:{eventId}:user:{userId}:hold   reservation ID milik user
```

Recommended Lua claim pattern:

```text
1. Cek user belum punya active hold untuk event.
2. Cek jumlah slot available cukup.
3. Pop N slot dari available.
4. Masukkan slot ke held.
5. Simpan reservation hash dengan TTL, contoh 10 menit.
6. Simpan user hold key dengan TTL.
7. Return reservationId dan slotIds.
```

Jika jumlah slot available lebih kecil dari jumlah tiket yang diminta, Lua script tidak boleh mem-pop slot apa pun dan harus return `sold_out` atau `not_enough_slots`.

Flow create order dengan queue:

```text
API request
-> Validasi user dan event
-> Redis Lua script mengklaim slot available menjadi held
-> Enqueue job create-order dengan reservationId sebagai idempotency key
-> Response reservationId/jobId ke frontend
-> Worker create-order membuat order pending
-> Worker membuat transaksi Midtrans
-> Worker menyimpan audit slot held ke database utama
-> Frontend polling GET /api/orders/:orderId atau reservation status
```

Saat Midtrans mengirim webhook sukses, update order menjadi `paid`, ubah slot Redis dari `held` menjadi `sold`, update `ticket_slots` di database utama menjadi `sold`, buat registration, lalu terbitkan ticket. Jika pembayaran gagal atau expired, ubah slot Redis dari `held` menjadi `available` atau `released`, lalu update audit database.

Tambahkan cleanup job untuk reservation TTL yang habis: baca reservation expired, pindahkan slot dari `held` kembali ke `available`, dan update audit database jika diperlukan.

Tambahkan constraint `registrations_event_user_unique` agar satu user tidak bisa mendaftar event yang sama lebih dari sekali. Aktifkan Redis persistence/AOF atau siapkan reconciliation job agar slot Redis dan data database utama tetap konsisten setelah restart.
