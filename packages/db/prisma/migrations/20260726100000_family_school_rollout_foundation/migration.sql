CREATE TYPE "BillingProviderEnvironment" AS ENUM ('TEST', 'LIVE');
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'WHATSAPP');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DELIVERED', 'FAILED');
CREATE TYPE "ViewerInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "SchoolImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');
CREATE TYPE "SchoolImportResource" AS ENUM ('STUDENTS', 'STAFF', 'VEHICLES', 'ROUTES', 'ASSIGNMENTS');

CREATE TABLE "billing_provider_plans" (
  "id" TEXT NOT NULL,
  "plan_price_id" TEXT NOT NULL,
  "provider" "BillingProvider" NOT NULL DEFAULT 'PAYSTACK',
  "environment" "BillingProviderEnvironment" NOT NULL,
  "provider_plan_code" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_provider_plans_pkey" PRIMARY KEY ("id")
);

INSERT INTO "billing_provider_plans" (
  "id", "plan_price_id", "provider", "environment", "provider_plan_code"
)
SELECT
  CONCAT('legacy_', "id"), "id", 'PAYSTACK'::"BillingProvider", 'TEST'::"BillingProviderEnvironment", "paystack_plan_code"
FROM "plan_prices"
WHERE "paystack_plan_code" IS NOT NULL;

ALTER TABLE "plan_prices" DROP COLUMN "paystack_plan_code";

ALTER TABLE "Subscription"
  ADD COLUMN "provider_environment" "BillingProviderEnvironment";

UPDATE "Subscription"
SET "provider_environment" = 'TEST'
WHERE "provider" = 'PAYSTACK' AND "provider_subscription_code" IS NOT NULL;

ALTER TABLE "billing_payment_attempts"
  ADD COLUMN "provider_plan_id" TEXT,
  ADD COLUMN "provider_environment" "BillingProviderEnvironment" NOT NULL DEFAULT 'TEST';

ALTER TABLE "billing_webhook_receipts"
  ADD COLUMN "provider_environment" "BillingProviderEnvironment" NOT NULL DEFAULT 'TEST';

CREATE TABLE "billing_notification_preferences" (
  "id" TEXT NOT NULL,
  "billing_account_id" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "consented_at" TIMESTAMP(3),
  "destination" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_deliveries" (
  "id" TEXT NOT NULL,
  "billing_account_id" TEXT NOT NULL,
  "trip_id" TEXT,
  "event_type" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "provider_message_id" TEXT,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "failure_reason" TEXT,
  "accepted_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_viewer_invites" (
  "id" TEXT NOT NULL,
  "billing_account_id" TEXT NOT NULL,
  "trip_id" TEXT NOT NULL,
  "invited_by" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone_number" TEXT,
  "token_hash" TEXT NOT NULL,
  "status" "ViewerInviteStatus" NOT NULL DEFAULT 'PENDING',
  "emergency_contact" BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "accepted_viewer_id" TEXT,
  "accepted_viewer_type" TEXT,
  "delivery_status" TEXT NOT NULL DEFAULT 'PENDING',
  "delivery_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_viewer_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "school_notification_policies" (
  "id" TEXT NOT NULL,
  "school_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "school_notification_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "school_import_jobs" (
  "id" TEXT NOT NULL,
  "school_id" TEXT NOT NULL,
  "requested_by" TEXT NOT NULL,
  "resource" "SchoolImportResource" NOT NULL,
  "status" "SchoolImportJobStatus" NOT NULL DEFAULT 'PENDING',
  "client_request_id" TEXT NOT NULL,
  "total_rows" INTEGER NOT NULL DEFAULT 0,
  "succeeded_rows" INTEGER NOT NULL DEFAULT 0,
  "failed_rows" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "school_import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_provider_plans_provider_plan_code_key" ON "billing_provider_plans"("provider_plan_code");
CREATE UNIQUE INDEX "billing_provider_plans_plan_price_id_provider_environment_key" ON "billing_provider_plans"("plan_price_id", "provider", "environment");
CREATE INDEX "billing_provider_plans_provider_environment_is_active_idx" ON "billing_provider_plans"("provider", "environment", "is_active");
CREATE UNIQUE INDEX "billing_notification_preferences_billing_account_id_channel_key" ON "billing_notification_preferences"("billing_account_id", "channel");
CREATE UNIQUE INDEX "notification_deliveries_provider_message_id_key" ON "notification_deliveries"("provider_message_id");
CREATE INDEX "notification_deliveries_billing_account_id_status_created_at_idx" ON "notification_deliveries"("billing_account_id", "status", "created_at");
CREATE INDEX "notification_deliveries_trip_id_created_at_idx" ON "notification_deliveries"("trip_id", "created_at");
CREATE UNIQUE INDEX "trip_viewer_invites_token_hash_key" ON "trip_viewer_invites"("token_hash");
CREATE INDEX "trip_viewer_invites_billing_account_id_status_idx" ON "trip_viewer_invites"("billing_account_id", "status");
CREATE INDEX "trip_viewer_invites_trip_id_status_idx" ON "trip_viewer_invites"("trip_id", "status");
CREATE UNIQUE INDEX "school_notification_policies_school_id_event_type_channel_key" ON "school_notification_policies"("school_id", "event_type", "channel");
CREATE INDEX "school_notification_policies_school_id_enabled_idx" ON "school_notification_policies"("school_id", "enabled");
CREATE UNIQUE INDEX "school_import_jobs_school_id_client_request_id_key" ON "school_import_jobs"("school_id", "client_request_id");
CREATE INDEX "school_import_jobs_school_id_resource_created_at_idx" ON "school_import_jobs"("school_id", "resource", "created_at");

ALTER TABLE "billing_provider_plans" ADD CONSTRAINT "billing_provider_plans_plan_price_id_fkey" FOREIGN KEY ("plan_price_id") REFERENCES "plan_prices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_payment_attempts" ADD CONSTRAINT "billing_payment_attempts_provider_plan_id_fkey" FOREIGN KEY ("provider_plan_id") REFERENCES "billing_provider_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_notification_preferences" ADD CONSTRAINT "billing_notification_preferences_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_viewer_invites" ADD CONSTRAINT "trip_viewer_invites_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_viewer_invites" ADD CONSTRAINT "trip_viewer_invites_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_notification_policies" ADD CONSTRAINT "school_notification_policies_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_import_jobs" ADD CONSTRAINT "school_import_jobs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
