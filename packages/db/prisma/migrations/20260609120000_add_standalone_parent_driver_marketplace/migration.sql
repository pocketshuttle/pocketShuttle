-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SCHOOL_MANAGED', 'STANDALONE');

-- CreateEnum
CREATE TYPE "DriverVerificationStatus" AS ENUM ('UNSUBMITTED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DriverRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'SCHOOL_MANAGED';
ALTER TABLE "Parent" ALTER COLUMN "schoolId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'driver';
ALTER TABLE "Driver" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'SCHOOL_MANAGED';
ALTER TABLE "Driver" ADD COLUMN "password" TEXT;
ALTER TABLE "Driver" ADD COLUMN "live_address" JSONB;
ALTER TABLE "Driver" ADD COLUMN "landmark" TEXT;
ALTER TABLE "Driver" ADD COLUMN "utility_bill_url" TEXT;
ALTER TABLE "Driver" ADD COLUMN "verification_status" "DriverVerificationStatus" NOT NULL DEFAULT 'UNSUBMITTED';
ALTER TABLE "Driver" ADD COLUMN "verification_rejection_reason" TEXT;
ALTER TABLE "Driver" ADD COLUMN "service_areas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Driver" ADD COLUMN "car_make" TEXT;
ALTER TABLE "Driver" ADD COLUMN "car_model" TEXT;
ALTER TABLE "Driver" ADD COLUMN "car_color" TEXT;
ALTER TABLE "Driver" ADD COLUMN "plate_number" TEXT;
ALTER TABLE "Driver" ADD COLUMN "vehicle_capacity" INTEGER;

-- CreateTable
CREATE TABLE "parent_children" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "age" INTEGER,
    "grade" TEXT,
    "address" TEXT,
    "pickup_note" TEXT,
    "image" TEXT,
    "active_driver_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_requests" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "status" "DriverRequestStatus" NOT NULL DEFAULT 'PENDING',
    "route_area" TEXT,
    "note" TEXT,
    "responded_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Parent_accountType_schoolId_idx" ON "Parent"("accountType", "schoolId");

-- CreateIndex
CREATE INDEX "Driver_accountType_schoolId_idx" ON "Driver"("accountType", "schoolId");

-- CreateIndex
CREATE INDEX "Driver_verification_status_idx" ON "Driver"("verification_status");

-- CreateIndex
CREATE INDEX "parent_children_parent_id_idx" ON "parent_children"("parent_id");

-- CreateIndex
CREATE INDEX "parent_children_active_driver_id_idx" ON "parent_children"("active_driver_id");

-- CreateIndex
CREATE INDEX "driver_requests_parent_id_status_idx" ON "driver_requests"("parent_id", "status");

-- CreateIndex
CREATE INDEX "driver_requests_driver_id_status_idx" ON "driver_requests"("driver_id", "status");

-- CreateIndex
CREATE INDEX "driver_requests_child_id_status_idx" ON "driver_requests"("child_id", "status");

-- AddForeignKey
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_active_driver_id_fkey" FOREIGN KEY ("active_driver_id") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_requests" ADD CONSTRAINT "driver_requests_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_requests" ADD CONSTRAINT "driver_requests_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "parent_children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_requests" ADD CONSTRAINT "driver_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
