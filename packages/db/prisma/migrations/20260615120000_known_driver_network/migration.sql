CREATE TYPE "ParentDriverConnectionStatus" AS ENUM ('INVITED', 'DRIVER_REQUESTED', 'PARENT_APPROVED', 'DECLINED', 'REVOKED');
CREATE TYPE "ChildDriverAssignmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REVOKED');
CREATE TYPE "ChildDriverEventType" AS ENUM ('ON_THE_WAY_TO_SCHOOL', 'PICKED_UP', 'DROPPED_OFF', 'LOCATION_UPDATED', 'ALERT_SENT');
CREATE TYPE "KnownDriverBillingStatus" AS ENUM ('FREE_TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED');
CREATE TYPE "KnownDriverPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "DriverInviteStatus" AS ENUM ('SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "driver_share_profiles" (
  "id" TEXT NOT NULL,
  "driver_id" TEXT NOT NULL,
  "share_id" TEXT NOT NULL,
  "searchable_email" TEXT,
  "searchable_phone" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "driver_share_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parent_driver_connections" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "driver_id" TEXT NOT NULL,
  "status" "ParentDriverConnectionStatus" NOT NULL DEFAULT 'INVITED',
  "requested_by" TEXT,
  "note" TEXT,
  "approved_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parent_driver_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "child_driver_assignments" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "driver_id" TEXT NOT NULL,
  "child_id" TEXT NOT NULL,
  "connection_id" TEXT NOT NULL,
  "status" "ChildDriverAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "billing_status" "KnownDriverBillingStatus" NOT NULL DEFAULT 'FREE_TRIAL',
  "monthly_amount" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "trial_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trial_ends_at" TIMESTAMP(3) NOT NULL,
  "current_period_start" TIMESTAMP(3),
  "current_period_end" TIMESTAMP(3),
  "last_status" "ChildDriverEventType",
  "last_status_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "child_driver_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "driver_invites" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "driver_id" TEXT,
  "email" TEXT,
  "phone_number" TEXT,
  "token_hash" TEXT NOT NULL,
  "status" "DriverInviteStatus" NOT NULL DEFAULT 'SENT',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "driver_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "child_driver_events" (
  "id" TEXT NOT NULL,
  "assignment_id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "driver_id" TEXT NOT NULL,
  "child_id" TEXT NOT NULL,
  "event_type" "ChildDriverEventType" NOT NULL,
  "actor_id" TEXT,
  "actor_type" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "child_driver_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "known_driver_payments" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "assignment_id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" "KnownDriverPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
  "provider_ref" TEXT,
  "authorization_url" TEXT,
  "paid_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "known_driver_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "driver_share_profiles_driver_id_key" ON "driver_share_profiles"("driver_id");
CREATE UNIQUE INDEX "driver_share_profiles_share_id_key" ON "driver_share_profiles"("share_id");
CREATE INDEX "driver_share_profiles_share_id_idx" ON "driver_share_profiles"("share_id");
CREATE INDEX "driver_share_profiles_searchable_email_idx" ON "driver_share_profiles"("searchable_email");
CREATE INDEX "driver_share_profiles_searchable_phone_idx" ON "driver_share_profiles"("searchable_phone");

CREATE UNIQUE INDEX "parent_driver_connections_parent_id_driver_id_key" ON "parent_driver_connections"("parent_id", "driver_id");
CREATE INDEX "parent_driver_connections_driver_id_status_idx" ON "parent_driver_connections"("driver_id", "status");
CREATE INDEX "parent_driver_connections_parent_id_status_idx" ON "parent_driver_connections"("parent_id", "status");

CREATE UNIQUE INDEX "child_driver_assignments_child_id_driver_id_key" ON "child_driver_assignments"("child_id", "driver_id");
CREATE INDEX "child_driver_assignments_parent_id_status_idx" ON "child_driver_assignments"("parent_id", "status");
CREATE INDEX "child_driver_assignments_driver_id_status_idx" ON "child_driver_assignments"("driver_id", "status");
CREATE INDEX "child_driver_assignments_billing_status_trial_ends_at_idx" ON "child_driver_assignments"("billing_status", "trial_ends_at");

CREATE UNIQUE INDEX "driver_invites_token_hash_key" ON "driver_invites"("token_hash");
CREATE INDEX "driver_invites_parent_id_status_idx" ON "driver_invites"("parent_id", "status");
CREATE INDEX "driver_invites_email_idx" ON "driver_invites"("email");
CREATE INDEX "driver_invites_phone_number_idx" ON "driver_invites"("phone_number");

CREATE INDEX "child_driver_events_assignment_id_created_at_idx" ON "child_driver_events"("assignment_id", "created_at");
CREATE INDEX "child_driver_events_parent_id_created_at_idx" ON "child_driver_events"("parent_id", "created_at");
CREATE INDEX "child_driver_events_driver_id_created_at_idx" ON "child_driver_events"("driver_id", "created_at");

CREATE UNIQUE INDEX "known_driver_payments_provider_ref_key" ON "known_driver_payments"("provider_ref");
CREATE INDEX "known_driver_payments_parent_id_status_idx" ON "known_driver_payments"("parent_id", "status");
CREATE INDEX "known_driver_payments_assignment_id_status_idx" ON "known_driver_payments"("assignment_id", "status");

ALTER TABLE "driver_share_profiles" ADD CONSTRAINT "driver_share_profiles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parent_driver_connections" ADD CONSTRAINT "parent_driver_connections_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parent_driver_connections" ADD CONSTRAINT "parent_driver_connections_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_driver_assignments" ADD CONSTRAINT "child_driver_assignments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_driver_assignments" ADD CONSTRAINT "child_driver_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_driver_assignments" ADD CONSTRAINT "child_driver_assignments_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "parent_children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_driver_assignments" ADD CONSTRAINT "child_driver_assignments_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "parent_driver_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_invites" ADD CONSTRAINT "driver_invites_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_invites" ADD CONSTRAINT "driver_invites_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "child_driver_events" ADD CONSTRAINT "child_driver_events_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "child_driver_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_driver_events" ADD CONSTRAINT "child_driver_events_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_driver_events" ADD CONSTRAINT "child_driver_events_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_driver_events" ADD CONSTRAINT "child_driver_events_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "parent_children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "known_driver_payments" ADD CONSTRAINT "known_driver_payments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "known_driver_payments" ADD CONSTRAINT "known_driver_payments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "child_driver_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
