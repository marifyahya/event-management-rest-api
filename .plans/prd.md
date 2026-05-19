# Event Management REST API PRD

Dokumen ini merangkum kebutuhan produk, schema database, endpoint minimal, timeline, dan catatan teknis untuk REST API manajemen event.

---

## 1. PRD Singkat 📌

### Latar Belakang

Penyelenggara event membutuhkan sistem backend untuk mengelola event, peserta, tiket, check-in, dan laporan secara terpusat. Tanpa sistem yang rapi, proses registrasi dan validasi tiket rentan terhadap duplikasi data, tiket tidak valid, dan laporan yang tidak akurat.

### Tujuan Produk

- Menyediakan REST API untuk membuat, mengelola, dan mempublikasikan event.
- Mendukung registrasi peserta, perebutan tiket terbatas, pembayaran Midtrans, dan penerbitan tiket digital.
- Memudahkan proses check-in dengan validasi ticket code atau QR token.
- Menyediakan dashboard dan laporan dasar untuk organizer.
- Menjaga keamanan data melalui authentication, authorization, dan validasi input.

### User Personas

| Persona | Kebutuhan Utama | Pain Point |
| --- | --- | --- |
| Event Organizer | Membuat event, memantau peserta, melihat laporan | Sulit memantau kapasitas dan status check-in |
| Attendee | Mendaftar event dan mendapatkan tiket | Proses daftar manual dan tiket sulit dilacak |
| Admin | Mengelola user, event, dan akses sistem | Membutuhkan kontrol data dan akses yang konsisten |

### Fitur Utama

| Priority | Feature | Description |
| --- | --- | --- |
| High | Authentication & Authorization | Register, login, profile, role-based access |
| High | Event Management | CRUD event, publish, cancel, filter event |
| High | Registration & Ticketing | Daftar event, reservasi tiket terbatas, generate tiket, lihat tiket |
| High | Payment with Midtrans | Membuat transaksi pembayaran, menerima webhook Midtrans, dan mengonfirmasi tiket setelah pembayaran sukses |
| Mid | Email Notification | Mengirim email ke pembeli untuk status order, pembayaran sukses, dan tiket digital |
| High | Check-in & Validation | Validasi tiket dan check-in peserta |
| Mid | Dashboard | Statistik event, peserta, tiket, dan check-in |
| Mid | Reports | Laporan registrasi dan check-in |
| Low | CSV Export | Export data laporan ke CSV |

### Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | Response API sederhana < 300 ms, pagination untuk list besar |
| Security | Password hashing, JWT/session token, RBAC, rate limit login |
| Scalability | Struktur modul per domain dan schema siap dimigrasikan |
| Reliability | Transaksi database untuk perebutan tiket, pembayaran, penerbitan tiket, dan check-in |
| Maintainability | Validasi request konsisten dengan Zod dan error format seragam |

---

## 2. Epic & Implementation Tasks 🧭

Epic breakdown dan sub-task implementasi dipisahkan ke file khusus agar PRD tetap fokus pada kebutuhan produk.

Lihat detail epic dan checklist implementasi di [epics.md](./epics.md).

---

## 3. Database Schema 🗄️

Schema database dipisahkan ke file khusus agar PRD tetap ringkas dan mudah dibaca.

Lihat detail schema tabel, relasi, recommended indexes, dan draft Prisma schema di [database-schema.md](./database-schema.md).

---

## 4. Timeline Rekomendasi 🗓️

| Day | Focus | Output |
| --- | --- | --- |
| Day 1 | Authentication | Register, login, auth middleware |
| Day 2 | Event Management | Event schema dan CRUD |
| Day 3 | Registration & Ticketing | Registration dan ticket transaction |
| Day 4 | Payment | Midtrans transaction, webhook, payment status |
| Day 5 | Check-in | Ticket validation dan check-in |
| Day 6 | Dashboard & Reports | Stats dan report endpoint |
| Day 7 | Hardening | Error handling, security review, edge cases |
| Day 8 | Testing & Docs | Build check, manual test, API docs |

---

## 5. Daftar API Endpoints Minimal 🚀

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
| DELETE | `/api/events/:eventId` | Archive event |
| POST | `/api/events/:eventId/publish` | Publish event |
| POST | `/api/events/:eventId/cancel` | Cancel event |
| POST | `/api/events/:eventId/register` | Register to event |
| POST | `/api/events/:eventId/ticket-reservations` | Claim ticket slots from event slot pool |
| GET | `/api/registrations/me` | My registrations |
| GET | `/api/events/:eventId/registrations` | Event attendees |
| POST | `/api/orders/:orderId/payments/midtrans` | Create Midtrans payment transaction |
| POST | `/api/payments/midtrans/webhook` | Midtrans payment callback |
| GET | `/api/orders/:orderId` | Order detail and payment status |
| GET | `/api/tickets/:ticketId` | Ticket detail |
| POST | `/api/check-ins/validate` | Validate ticket |
| POST | `/api/check-ins` | Check-in ticket |
| GET | `/api/events/:eventId/check-ins` | Event check-ins |
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/events/:eventId/stats` | Event stats |
| GET | `/api/events/:eventId/reports/registrations` | Registration report |
| GET | `/api/events/:eventId/reports/check-ins` | Check-in report |

---

## 6. Catatan Teknis 🛠️

### Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL sebagai database utama
- Redis untuk slot pool tiket dan queue backend
- BullMQ untuk worker asynchronous
- Zod untuk request validation
- dotenv untuk environment configuration

### Suggested Libraries

| Library | Purpose |
| --- | --- |
| `bcrypt` atau `argon2` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `helmet` | Security headers |
| `cors` | CORS configuration |
| `express-rate-limit` | Rate limit endpoint sensitif |
| `nanoid` | Generate ticket code dan QR token |
| `csv-stringify` | Export CSV |
| `midtrans-client` | Integrasi pembayaran Midtrans Snap/Core API |
| `nodemailer` atau email provider SDK | Mengirim email order, pembayaran, dan tiket ke pembeli |
| `bullmq` + `ioredis` | Redis slot pool, queue create order, payment job, dan email notification |

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

- Payment provider yang digunakan adalah Midtrans.
- Untuk event dengan tiket terbatas, perebutan tiket menggunakan slot pool di Redis.
- Setiap tiket direpresentasikan sebagai slot ID di Redis dengan status `available`, `held`, `sold`, `released`, atau `expired`.
- API mengklaim slot `available` secara atomik menggunakan Redis Lua script.
- Setelah slot berhasil diklaim di Redis, API memasukkan job `create-order` ke queue dengan `reservationId` sebagai idempotency key.
- Worker `create-order` membuat order pending, membuat payment Midtrans, dan menyimpan payment metadata.
- Endpoint reservasi mengembalikan `reservationId` atau `jobId`, lalu frontend melakukan polling status order.
- Tiket digital hanya diterbitkan setelah Midtrans mengirim status pembayaran sukses.
- Jika pembayaran gagal atau expired, order dibatalkan dan slot `held` dikembalikan menjadi `available` atau `released`.
- Database utama tetap menyimpan data final: order, payment, ticket, dan audit slot.
- Satu user tidak boleh memiliki lebih dari satu registration aktif pada event yang sama.

### Email Notification Rules

- Kirim email order created saat order pending berhasil dibuat.
- Kirim email payment success setelah webhook Midtrans sukses diproses.
- Kirim email e-ticket ke pembeli setelah tiket digital diterbitkan.
- Kirim email payment failed/expired jika pembayaran gagal atau melewati batas waktu.
- Email harus dikirim asynchronous melalui job/queue agar webhook payment tidak lambat.
- Jika email gagal terkirim, status order/ticket tidak boleh rollback; simpan log kegagalan untuk retry.
