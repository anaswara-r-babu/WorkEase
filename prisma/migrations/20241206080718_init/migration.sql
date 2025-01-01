-- CreateTable
CREATE TABLE "JobCategory" (
    "id" SERIAL NOT NULL,
    "jobName" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
