/*
  Warnings:

  - A unique constraint covering the columns `[confirmationToken]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Employee_confirmationToken_key" ON "Employee"("confirmationToken");
