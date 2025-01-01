/*
  Warnings:

  - Added the required column `bookingId` to the `Complaints` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Complaints" ADD COLUMN     "bookingId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Complaints" ADD CONSTRAINT "Complaints_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
