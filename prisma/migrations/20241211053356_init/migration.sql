/*
  Warnings:

  - You are about to drop the column `latitude` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "maplink" TEXT;
