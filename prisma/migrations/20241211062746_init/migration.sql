/*
  Warnings:

  - You are about to drop the `place` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "place";

-- CreateTable
CREATE TABLE "Place" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subplace" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "placeId" INTEGER NOT NULL,

    CONSTRAINT "Subplace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");

-- AddForeignKey
ALTER TABLE "Subplace" ADD CONSTRAINT "Subplace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
