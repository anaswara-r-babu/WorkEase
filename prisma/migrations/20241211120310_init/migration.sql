/*
  Warnings:

  - The `confirmationKey` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "Employee_confirmationKey_key";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "confirmationKey",
ADD COLUMN     "confirmationKey" BOOLEAN DEFAULT false;
