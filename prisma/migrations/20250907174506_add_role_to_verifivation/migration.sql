/*
  Warnings:

  - A unique constraint covering the columns `[bus_number]` on the table `buses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role` to the `verificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "StudentPresence" ADD VALUE 'ON_THE_WAY';

-- AlterTable
ALTER TABLE "ResetPasswordToken" ADD COLUMN     "role" TEXT;

-- AlterTable
ALTER TABLE "verificationToken" ADD COLUMN     "role" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Pickup" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "pickUpTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedBy" TEXT,

    CONSTRAINT "Pickup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buses_bus_number_key" ON "buses"("bus_number");

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
