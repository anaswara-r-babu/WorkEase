/*
  Warnings:

  - A unique constraint covering the columns `[confirmationKey]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "confirmationKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_confirmationKey_key" ON "Employee"("confirmationKey");
