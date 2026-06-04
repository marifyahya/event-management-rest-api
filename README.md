# Event Management REST API

REST API untuk manajemen event, registrasi peserta, pembayaran tiket, slot pool tiket terbatas, check-in, dan laporan. Project ini memakai PostgreSQL sebagai database utama, Redis untuk slot pool/queue, dan BullMQ worker untuk proses asynchronous seperti pembuatan order.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Zod
- JWT
- bcrypt
- Pino logger

## Install

```bash
npm install
```

Copy environment file:

```bash
cp .env.example .env
```

Sesuaikan isi `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://event_user:event_password@localhost:5432/event_management?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="1d"
LOG_LEVEL="info"
MIDTRANS_SERVER_KEY="your_midtrans_server_key"
MIDTRANS_CLIENT_KEY="your_midtrans_client_key"
MIDTRANS_IS_PRODUCTION=false
```

Pastikan PostgreSQL database dan Redis sudah berjalan.

## Database

Generate Prisma Client:

```bash
npm run db:generate
```

Jalankan migration:

```bash
npm run db:migrate
```

Jalankan seeder untuk membuat data awal, termasuk user admin:

```bash
npm run db:seed
```

Default admin dari seeder:

```text
Email: admin@example.com
Password: password
```

Opsional, buka Prisma Studio:

```bash
npm run db:studio
```

## Running

Development server:

```bash
npm run dev
```

Server berjalan di:

```text
http://localhost:3000
```

Jalankan semua worker (dalam satu terminal):

```bash
npm run workers
```

Atau jalankan worker secara terpisah:

```bash
npm run worker:create-payment
npm run worker:order-expire
```

Build dan production run:

```bash
npm run build
npm run start
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run development server |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled app |
| `npm run workers` | Run all BullMQ workers (recommended) |
| `npm run worker:create-payment` | Run create-payment worker only |
| `npm run worker:order-expire` | Run order-expire worker only |
| `npm run test` | Run TypeScript build check |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run Prisma migration |
| `npm run db:push` | Push schema without migration, for prototyping |
| `npm run db:seed` | Seed initial database data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run format` | Format files with Prettier |
| `npm run format:check` | Check formatting |
