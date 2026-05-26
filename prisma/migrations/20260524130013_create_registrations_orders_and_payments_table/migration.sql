/*
  Warnings:

  - You are about to alter the column `title` on the `events` table. The data in that column could be lost. The data in that column will be cast from `VarChar(120)` to `VarChar(100)`.
  - You are about to alter the column `category` on the `events` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(25)`.
  - You are about to alter the column `location` on the `events` table. The data in that column could be lost. The data in that column will be cast from `VarChar(120)` to `VarChar(100)`.
  - You are about to alter the column `status` on the `events` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `VarChar(12)`.
  - You are about to alter the column `cancel_reason` on the `events` table. The data in that column could be lost. The data in that column will be cast from `VarChar(120)` to `VarChar(80)`.
  - You are about to alter the column `full_name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(120)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(80)`.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(12)`.

*/
-- AlterTable
ALTER TABLE "events" ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "category" SET DATA TYPE VARCHAR(25),
ALTER COLUMN "location" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(12),
ALTER COLUMN "cancel_reason" SET DATA TYPE VARCHAR(80);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "full_name" SET DATA TYPE VARCHAR(75),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(120),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "role" SET DATA TYPE VARCHAR(12);

-- CreateTable
CREATE TABLE "registrations" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(12) NOT NULL DEFAULT 'registered',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "status" VARCHAR(12) NOT NULL DEFAULT 'pending',
    "reservation_id" VARCHAR(36),
    "job_id" VARCHAR(36),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal_amount" INTEGER NOT NULL,
    "admin_fee" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" VARCHAR(12) NOT NULL DEFAULT 'midtrans',
    "provider_order_id" VARCHAR(50) NOT NULL,
    "provider_transaction_id" VARCHAR(50),
    "payment_type" VARCHAR(25),
    "status" VARCHAR(12) NOT NULL DEFAULT 'pending',
    "gross_amount" INTEGER NOT NULL,
    "snap_token" VARCHAR(150),
    "snap_redirect_url" VARCHAR(250),
    "raw_notification" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_registration_id_key" ON "orders"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_reservation_id_key" ON "orders"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_order_id_key" ON "payments"("provider_order_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
