/*
  Warnings:

  - You are about to drop the column `place` on the `Employee` table. All the data in the column will be lost.
  - Added the required column `placeId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subplaceId` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "place",
ADD COLUMN     "placeId" INTEGER NOT NULL,
ADD COLUMN     "subplaceId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_subplaceId_fkey" FOREIGN KEY ("subplaceId") REFERENCES "Subplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
