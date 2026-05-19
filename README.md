# Event Management REST API

REST API berbasis Express.js dan TypeScript untuk manajemen event, pendaftaran peserta, tiket, check-in, dan laporan. Project ini dirancang menggunakan Prisma ORM dengan PostgreSQL, Redis slot pool, BullMQ worker, validasi data dengan Zod, dan konfigurasi environment melalui dotenv.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Zod

## Cara Menjalankan

### 1. Install dependencies

```bash
npm install
```

### 2. Buat file `.env`

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Sesuaikan nilai database connection di `.env`:

```env
DATABASE_URL="postgresql://event_user:event_password@localhost:5432/event_management?schema=public"
REDIS_URL="redis://localhost:6379"
QUEUE_CREATE_ORDER_NAME="create-order"
PORT=3000
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Jalankan migration database

```bash
npm run db:migrate
```

### 5. Jalankan development server

```bash
npm run dev
```

Server akan berjalan di:

```text
http://localhost:3000
```

### 6. Jalankan worker create order

Worker ini memproses job setelah slot tiket berhasil di-hold di Redis.

```bash
npm run worker:create-order
```

## Script Tersedia

| Command | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan server development dengan watch mode |
| `npm run build` | Compile TypeScript ke folder `dist` |
| `npm run start` | Menjalankan hasil build dari `dist/server.js` |
| `npm run worker:create-order` | Menjalankan BullMQ worker untuk membuat order setelah reservasi slot |
| `npm run test` | Menjalankan build check |
| `npm run db:generate` | Generate Prisma Client dari `prisma/schema.prisma` |
| `npm run db:migrate` | Membuat dan menjalankan migration Prisma |
| `npm run db:push` | Push schema Prisma ke database tanpa migration file, gunakan hanya untuk prototyping |
| `npm run db:studio` | Membuka Prisma Studio |

## Endpoint Dasar

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/` | Welcome response |
| `GET` | `/api/health` | Health check API |

## Build Production

```bash
npm run build
npm run start
```
