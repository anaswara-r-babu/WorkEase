/*
  Warnings:

  - A unique constraint covering the columns `[jobName]` on the table `JobCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_jobName_key" ON "JobCategory"("jobName");
