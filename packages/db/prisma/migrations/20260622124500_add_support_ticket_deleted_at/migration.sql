ALTER TABLE "support_tickets"
  ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "support_tickets_deleted_at_idx" ON "support_tickets"("deleted_at");
