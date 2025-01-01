-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "adminUUID" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_adminUUID_key" ON "admin"("adminUUID");

-- CreateIndex
CREATE UNIQUE INDEX "admin_username_key" ON "admin"("username");
