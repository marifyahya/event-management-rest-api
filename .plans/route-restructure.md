# Route Restructure: Public Events + Admin Events

## Route Architecture

### Public (no auth)
```
GET  /api/events        → daftar event published
GET  /api/events/:id    → detail event published
```

### Admin (auth required)
```
GET    /api/admin/events         → list all events
POST   /api/admin/events         → create event
GET    /api/admin/events/:id     → detail any event
PATCH  /api/admin/events/:id     → update event
DELETE /api/admin/events/:id     → delete (archive only)
POST   /api/admin/events/:id/publish
POST   /api/admin/events/:id/cancel
POST   /api/admin/events/:id/move-to-draft
POST   /api/admin/events/:id/archive
```

## Files

### Modified
| File | Perubahan |
|------|-----------|
| `src/routes/api.ts` | Split `publicRouter` + `adminRouter` |
| `src/routes/event.routes.ts` | Hapus GET routes, path → `/admin/events` |
| `src/controllers/event.controller.ts` | Tambah `publicIndex` & `publicShow` (filter published) |
| `src/services/event.service.ts` | Tambah `getAllPublishedEvents` & `findPublishedById` |

### New
| File | Isi |
|------|-----|
| `src/routes/public-event.routes.ts` | GET /events, GET /events/:id (public) |

## Public Event Controller Logic

### `publicIndex`
- Filter: `status === "published"` + `deletedAt === null`
- Sama seperti `index` tapi hanya published
- Pagination, search, category filter tetap

### `publicShow`
- Cari event dengan `id` AND `status === "published"` AND `deletedAt === null`
- Return 404 jika tidak ditemukan (tidak kasih tahu bahwa event exists tapi tidak published)

---

# Redis Slot + Payment Flow

## Slot Competition (Redis-only)

### Redis Keys
| Key | Type | TTL | Description |
|-----|------|-----|-------------|
| `event:{eventId}:slots` | String (integer) | - | Sisa slot tersedia |
| `event:{eventId}:reservation:{reservationId}` | Hash | 5 menit | Data reservasi (userId, eventId) |

### Flow
```
POST /events/:id/register  (auth required)
│
├─ 1. DECR event:{id}:slots          (atomic, cek sisa slot)
│     Jika hasil < 0 → INCR back + return SOLD OUT
│
├─ 2. SET event:{id}:reservation:{uuid}
│     { userId, eventId, status: "held" }
│     EXPIRE 300 (5 menit)
│
├─ 3. Enqueue create-order job (BullMQ)
│     { reservationId, eventId, userId }
│
└─ Return { reservationId, jobId }
```

### Worker: `create-order`
```
Terima job → DB transaction:
├─ Create Registration (status: "registered")
├─ Create Order (status: "pending", total_amount)
├─ Call Midtrans Snap API → dapat snap_token
├─ Create Payment (status: "pending", snap_token)
└─ Return { orderId, snap_token }
```

### Midtrans Webhook
```
POST /payments/midtrans/webhook
│
├─ Terima notifikasi settlement/capture/deny/expire
├─ Cari Payment via provider_order_id
│
├─ [SUCCESS: settlement/capture]
│   ├─ Update Payment → status: "settlement"
│   ├─ Update Order → status: "paid", paidAt: now
│   ├─ Create Ticket (ticket_code, qr_token)
│   └─ DEL reservation dari Redis
│
└─ [FAILED: deny/cancel/expire/failure]
    ├─ Update Payment → status sesuai
    ├─ Update Order → status: "failed"
    ├─ INCR event:{id}:slots (release slot)
    └─ DEL reservation dari Redis
```

### Recovery (Redis Restart)
Saat startup, seeding ulang slot counter dari DB:
```
event:{id}:slots = events.capacity - COUNT(registrations WHERE status != 'cancelled')
```

## Mengapa Redis?

1. **Atomic DECR/INCR** — tidak ada race condition pada slot terakhir
2. **TTL built-in** — reservation expired otomatis tanpa cron job
3. **Cepat** — operasi in-memory, tidak perlu DB transaction untuk claim slot
4. **DB tetap source of truth** — order, payment, ticket di PostgreSQL
