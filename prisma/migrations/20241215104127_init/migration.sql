/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");
