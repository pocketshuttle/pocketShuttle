ALTER TABLE "Driver" ADD COLUMN "last_active_at" TIMESTAMP(3);

CREATE INDEX "Driver_last_active_at_idx" ON "Driver"("last_active_at");
