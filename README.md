# Event Management REST API

This is REST API for event management. You can register people, pay tickets, have limited ticket slot, do check-in, and see reports. 
This project use PostgreSQL for main database. It use Redis for queue and ticket slot. It also use BullMQ worker for background process like create order.

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
- pdfmake (Make PDF Ticket)
- Supabase Storage (Save File in Cloud)
- Rate limiter

## Install

First, install packages:

```bash
npm install
```

Copy the env file:

```bash
cp .env.example .env
```

Change your `.env` like this:

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

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your.email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="\"Tickets.Live\" <your.email@gmail.com>"
SMTP_TO_MAIL="dev-sink@example.com" # (Optional) All email will go here in development mode

# Storage Setup (Driver: local or supabase)
STORAGE_DRIVER="local"
APP_URL="http://localhost:3000"

# Supabase Storage Setup
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET="event-orgnzr"
```

Make sure your PostgreSQL and Redis is running.

## Database

Make Prisma Client:

```bash
npm run db:generate
```

Run migration to make tables:

```bash
npm run db:migrate
```

Run seed to make first data, like admin user:

```bash
npm run db:seed
```

Default admin from seed:

```text
Email: admin@example.com
Password: password
```

If you want, open Prisma Studio to see data:

```bash
npm run db:studio
```

## Running

Run server for development:

```bash
npm run dev
```

Run API server and all workers together:

```bash
npm run dev:all
```

API server will run at:

```text
http://localhost:3000
```

Run all workers (in one terminal):

```bash
npm run workers
```

Or you can run worker one by one:

```bash
npm run worker:create-payment
npm run worker:order-expire
npm run worker:send-email
npm run worker:generate-pdf
```

Build and run for production:

```bash
npm run build
npm run start
```

## Docker (Docker Compose)

You can run this project using Docker Compose. It will spin up PostgreSQL, Redis, the API, and the BullMQ Worker.

1. Make sure Docker is running.
2. Build and start all services in the background:
   ```bash
   docker-compose up --build -d
   ```
3. Check the logs:
   ```bash
   docker-compose logs -f
   ```
4. API will be available at `http://localhost:3000`.

To stop the services:
```bash
docker-compose down
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run development server |
| `npm run dev:all` | Run API and workers together |
| `npm run build` | Build TypeScript code |
| `npm run start` | Run production app |
| `npm run workers` | Run all BullMQ workers |
| `npm run worker:create-payment` | Run payment worker |
| `npm run worker:order-expire` | Run order expire worker |
| `npm run worker:send-email` | Run email worker |
| `npm run worker:generate-pdf` | Run make PDF worker |
| `npm run test` | Run test |
| `npm run db:generate` | Make Prisma Client |
| `npm run db:migrate` | Run database migration |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Put initial data to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run format` | Make code neat |
| `npm run format:check` | Check code format |
