-- CreateEnum
CREATE TYPE "RecurringTripSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "recurring_trip_suggestions" (
    "id" TEXT NOT NULL,
    "billing_account_id" TEXT NOT NULL,
    "destination_lat" DOUBLE PRECISION NOT NULL,
    "destination_lng" DOUBLE PRECISION NOT NULL,
    "destination_label" TEXT,
    "occurrence_count" INTEGER NOT NULL,
    "last_trip_id" TEXT,
    "status" "RecurringTripSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "notified_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "created_template_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_trip_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_trip_suggestions_billing_account_id_status_idx" ON "recurring_trip_suggestions"("billing_account_id", "status");

-- AddForeignKey
ALTER TABLE "recurring_trip_suggestions" ADD CONSTRAINT "recurring_trip_suggestions_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
