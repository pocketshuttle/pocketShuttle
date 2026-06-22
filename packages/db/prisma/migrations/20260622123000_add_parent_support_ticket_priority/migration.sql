CREATE TYPE "SupportTicketPriority" AS ENUM ('HIGH', 'NORMAL');

ALTER TABLE "support_tickets"
  ADD COLUMN "parent_id" TEXT,
  ADD COLUMN "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL';

CREATE INDEX "support_tickets_priority_status_created_at_idx" ON "support_tickets"("priority", "status", "created_at");
CREATE INDEX "support_tickets_parent_id_created_at_idx" ON "support_tickets"("parent_id", "created_at");

ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
