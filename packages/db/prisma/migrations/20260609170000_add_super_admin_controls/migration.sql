ALTER TABLE "users"
ADD COLUMN "suspended_at" TIMESTAMP(3),
ADD COLUMN "suspended_reason" TEXT,
ADD COLUMN "suspended_by_id" TEXT;

ALTER TABLE "Teacher"
ADD COLUMN "suspended_at" TIMESTAMP(3),
ADD COLUMN "suspended_reason" TEXT,
ADD COLUMN "suspended_by_id" TEXT;

ALTER TABLE "Driver"
ADD COLUMN "suspended_at" TIMESTAMP(3),
ADD COLUMN "suspended_reason" TEXT,
ADD COLUMN "suspended_by_id" TEXT;

ALTER TABLE "Parent"
ADD COLUMN "suspended_at" TIMESTAMP(3),
ADD COLUMN "suspended_reason" TEXT,
ADD COLUMN "suspended_by_id" TEXT;

ALTER TABLE "Plan"
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
