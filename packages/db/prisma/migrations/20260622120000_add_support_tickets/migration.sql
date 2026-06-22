CREATE TYPE "SupportTicketStatus" AS ENUM ('PENDING', 'FIXED');

CREATE TABLE "support_tickets" (
  "id" TEXT NOT NULL,
  "requester_role" TEXT NOT NULL DEFAULT 'driver',
  "driver_id" TEXT,
  "requester_name" TEXT NOT NULL,
  "requester_identifier" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'PENDING',
  "fixed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_status_created_at_idx" ON "support_tickets"("status", "created_at");
CREATE INDEX "support_tickets_driver_id_created_at_idx" ON "support_tickets"("driver_id", "created_at");

ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
