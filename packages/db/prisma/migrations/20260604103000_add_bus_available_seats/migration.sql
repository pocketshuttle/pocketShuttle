-- AlterTable
ALTER TABLE "buses" ADD COLUMN "available_seats" INTEGER NOT NULL DEFAULT 0;

-- Backfill live availability from existing capacity for current records.
UPDATE "buses" SET "available_seats" = "seat_number";
