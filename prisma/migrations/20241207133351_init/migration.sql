/*
  Warnings:

  - You are about to drop the column `confirmation_key` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "confirmation_key",
ADD COLUMN     "confirmationKey" TEXT;
