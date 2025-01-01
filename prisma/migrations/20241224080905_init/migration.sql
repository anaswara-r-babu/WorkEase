-- CreateTable
CREATE TABLE "Complaints" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Complaints" ADD CONSTRAINT "Complaints_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaints" ADD CONSTRAINT "Complaints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
