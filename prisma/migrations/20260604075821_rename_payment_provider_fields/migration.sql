/*
  Warnings:

  - You are about to drop the column `snap_redirect_url` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `snap_token` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "snap_redirect_url",
DROP COLUMN "snap_token",
ADD COLUMN     "checkout_url" TEXT,
ADD COLUMN     "provider_token" TEXT;
