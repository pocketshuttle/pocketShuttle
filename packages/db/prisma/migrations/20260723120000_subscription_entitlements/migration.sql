CREATE TYPE "BillingAccountType" AS ENUM ('FAMILY', 'SCHOOL', 'ORGANIZATION');
CREATE TYPE "PlanAudience" AS ENUM ('FAMILY', 'SCHOOL', 'ENTERPRISE');
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY');
CREATE TYPE "BillingProvider" AS ENUM ('PAYSTACK', 'MANUAL');
CREATE TYPE "PlatformSubscriptionStatus" AS ENUM (
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'NON_RENEWING',
  'CANCELLED',
  'EXPIRED'
);
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

ALTER TABLE "Plan"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "entitlements" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "audience" "PlanAudience" NOT NULL DEFAULT 'SCHOOL',
  ADD COLUMN "tier" "PlanTier" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "is_purchasable" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Plan"
SET "code" =
  CASE
    WHEN upper("name") = 'FREE' THEN 'FREE_SCHOOL'
    WHEN upper("name") = 'PRO' THEN 'SCHOOL_PRO'
    WHEN upper("name") = 'ENTERPRISE' THEN 'ENTERPRISE'
    ELSE upper(regexp_replace("name", '[^a-zA-Z0-9]+', '_', 'g')) || '_' || substr("id", 1, 6)
  END;

ALTER TABLE "Plan" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

CREATE TABLE "billing_accounts" (
  "id" TEXT NOT NULL,
  "type" "BillingAccountType" NOT NULL,
  "user_id" TEXT,
  "parent_id" TEXT,
  "billing_email" TEXT,
  "provider_customer_code" TEXT,
  "entitlement_overrides" JSONB NOT NULL DEFAULT '{}',
  "enforcement_enabled" BOOLEAN NOT NULL DEFAULT false,
  "rollout_flags" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_accounts_owner_check" CHECK (
    ("type" = 'SCHOOL' AND "user_id" IS NOT NULL AND "parent_id" IS NULL) OR
    ("type" = 'FAMILY' AND "parent_id" IS NOT NULL AND "user_id" IS NULL) OR
    ("type" = 'ORGANIZATION' AND "user_id" IS NULL AND "parent_id" IS NULL)
  )
);

CREATE UNIQUE INDEX "billing_accounts_user_id_key" ON "billing_accounts"("user_id");
CREATE UNIQUE INDEX "billing_accounts_parent_id_key" ON "billing_accounts"("parent_id");
CREATE INDEX "billing_accounts_type_idx" ON "billing_accounts"("type");

ALTER TABLE "billing_accounts"
  ADD CONSTRAINT "billing_accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_accounts"
  ADD CONSTRAINT "billing_accounts_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "billing_accounts" (
  "id",
  "type",
  "user_id",
  "billing_email",
  "enforcement_enabled",
  "created_at",
  "updated_at"
)
SELECT
  "id" || '_billing',
  'SCHOOL',
  "id",
  "email",
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users";

INSERT INTO "billing_accounts" (
  "id",
  "type",
  "parent_id",
  "billing_email",
  "enforcement_enabled",
  "created_at",
  "updated_at"
)
SELECT
  "id" || '_billing',
  'FAMILY',
  "id",
  "email",
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Parent"
WHERE "accountType" = 'STANDALONE';

CREATE TABLE "plan_prices" (
  "id" TEXT NOT NULL,
  "plan_id" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
  "paystack_plan_code" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_prices_paystack_plan_code_key" ON "plan_prices"("paystack_plan_code");
CREATE INDEX "plan_prices_plan_id_is_active_idx" ON "plan_prices"("plan_id", "is_active");
ALTER TABLE "plan_prices"
  ADD CONSTRAINT "plan_prices_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subscription"
  ADD COLUMN "billing_account_id" TEXT,
  ADD COLUMN "plan_price_id" TEXT,
  ADD COLUMN "current_period_start" TIMESTAMP(3),
  ADD COLUMN "current_period_end" TIMESTAMP(3),
  ADD COLUMN "grace_ends_at" TIMESTAMP(3),
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "provider" "BillingProvider" NOT NULL DEFAULT 'PAYSTACK',
  ADD COLUMN "provider_subscription_code" TEXT,
  ADD COLUMN "provider_email_token" TEXT,
  ADD COLUMN "provider_next_payment_at" TIMESTAMP(3);

UPDATE "Subscription"
SET "billing_account_id" = "userId" || '_billing';

ALTER TABLE "Subscription" ALTER COLUMN "billing_account_id" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "endDate" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription"
  ALTER COLUMN "status" TYPE "PlatformSubscriptionStatus"
  USING (
    CASE
      WHEN upper("status") = 'TRIALING' THEN 'TRIALING'
      WHEN upper("status") = 'PAST_DUE' THEN 'PAST_DUE'
      WHEN upper("status") = 'NON_RENEWING' THEN 'NON_RENEWING'
      WHEN upper("status") = 'CANCELLED' THEN 'CANCELLED'
      WHEN upper("status") = 'EXPIRED' THEN 'EXPIRED'
      ELSE 'ACTIVE'
    END
  )::"PlatformSubscriptionStatus";
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP INDEX IF EXISTS "Subscription_userId_idx";
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_billing_account_id_fkey"
  FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_plan_price_id_fkey"
  FOREIGN KEY ("plan_price_id") REFERENCES "plan_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Subscription_provider_subscription_code_key"
  ON "Subscription"("provider_subscription_code");
CREATE INDEX "Subscription_billing_account_id_status_idx"
  ON "Subscription"("billing_account_id", "status");
CREATE INDEX "Subscription_userId_startDate_idx"
  ON "Subscription"("userId", "startDate");

CREATE TABLE "billing_payment_attempts" (
  "id" TEXT NOT NULL,
  "billing_account_id" TEXT NOT NULL,
  "subscription_id" TEXT,
  "plan_price_id" TEXT,
  "provider" "BillingProvider" NOT NULL DEFAULT 'PAYSTACK',
  "provider_reference" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" "BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "authorization_url" TEXT,
  "paid_at" TIMESTAMP(3),
  "failure_reason" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_payment_attempts_provider_reference_key"
  ON "billing_payment_attempts"("provider_reference");
CREATE INDEX "billing_payment_attempts_billing_account_id_status_idx"
  ON "billing_payment_attempts"("billing_account_id", "status");
ALTER TABLE "billing_payment_attempts"
  ADD CONSTRAINT "billing_payment_attempts_billing_account_id_fkey"
  FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_payment_attempts"
  ADD CONSTRAINT "billing_payment_attempts_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_payment_attempts"
  ADD CONSTRAINT "billing_payment_attempts_plan_price_id_fkey"
  FOREIGN KEY ("plan_price_id") REFERENCES "plan_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "billing_webhook_receipts" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "provider" "BillingProvider" NOT NULL DEFAULT 'PAYSTACK',
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_webhook_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_webhook_receipts_fingerprint_key"
  ON "billing_webhook_receipts"("fingerprint");
CREATE INDEX "billing_webhook_receipts_event_type_processed_at_idx"
  ON "billing_webhook_receipts"("event_type", "processed_at");

CREATE TABLE "premium_message_usage" (
  "id" TEXT NOT NULL,
  "billing_account_id" TEXT NOT NULL,
  "period_key" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "premium_message_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "premium_message_usage_billing_account_id_period_key_channel_key"
  ON "premium_message_usage"("billing_account_id", "period_key", "channel");
ALTER TABLE "premium_message_usage"
  ADD CONSTRAINT "premium_message_usage_billing_account_id_fkey"
  FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organizations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

ALTER TABLE "billing_accounts" ADD COLUMN "organization_id" TEXT;
CREATE UNIQUE INDEX "billing_accounts_organization_id_key"
  ON "billing_accounts"("organization_id");
ALTER TABLE "billing_accounts" DROP CONSTRAINT "billing_accounts_owner_check";
ALTER TABLE "billing_accounts"
  ADD CONSTRAINT "billing_accounts_owner_check" CHECK (
    ("type" = 'SCHOOL' AND "user_id" IS NOT NULL AND "parent_id" IS NULL AND "organization_id" IS NULL) OR
    ("type" = 'FAMILY' AND "parent_id" IS NOT NULL AND "user_id" IS NULL AND "organization_id" IS NULL) OR
    ("type" = 'ORGANIZATION' AND "organization_id" IS NOT NULL AND "user_id" IS NULL AND "parent_id" IS NULL)
  );
ALTER TABLE "billing_accounts"
  ADD CONSTRAINT "billing_accounts_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trip_templates" (
  "id" TEXT NOT NULL,
  "billing_account_id" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "trip_type" "TripType" NOT NULL,
  "origin" JSONB,
  "destination" JSONB,
  "schedule" JSONB NOT NULL,
  "next_run_at" TIMESTAMP(3),
  "last_generated_at" TIMESTAMP(3),
  "metadata" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "trip_templates_billing_account_id_is_active_idx"
  ON "trip_templates"("billing_account_id", "is_active");
CREATE INDEX "trip_templates_is_active_next_run_at_idx"
  ON "trip_templates"("is_active", "next_run_at");
ALTER TABLE "trip_templates"
  ADD CONSTRAINT "trip_templates_billing_account_id_fkey"
  FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "custom_places" (
  "id" TEXT NOT NULL,
  "billing_account_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "radius_meters" INTEGER NOT NULL DEFAULT 250,
  "place_type" TEXT NOT NULL DEFAULT 'custom',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "custom_places_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "custom_places_billing_account_id_is_active_idx"
  ON "custom_places"("billing_account_id", "is_active");
ALTER TABLE "custom_places"
  ADD CONSTRAINT "custom_places_billing_account_id_fkey"
  FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trip_geofence_states" (
  "id" TEXT NOT NULL,
  "trip_id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "is_inside" BOOLEAN NOT NULL DEFAULT false,
  "last_event_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_geofence_states_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trip_geofence_states_trip_id_place_id_key"
  ON "trip_geofence_states"("trip_id", "place_id");
CREATE INDEX "trip_geofence_states_trip_id_is_inside_idx"
  ON "trip_geofence_states"("trip_id", "is_inside");
ALTER TABLE "trip_geofence_states"
  ADD CONSTRAINT "trip_geofence_states_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_geofence_states"
  ADD CONSTRAINT "trip_geofence_states_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "custom_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_branches" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "school_id" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_branches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_branches_school_id_key" ON "organization_branches"("school_id");
CREATE UNIQUE INDEX "organization_branches_organization_id_code_key"
  ON "organization_branches"("organization_id", "code");
CREATE INDEX "organization_branches_organization_id_idx"
  ON "organization_branches"("organization_id");
ALTER TABLE "organization_branches"
  ADD CONSTRAINT "organization_branches_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_members" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "permissions" TEXT[],
  "branch_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_members_organization_id_actor_type_actor_id_key"
  ON "organization_members"("organization_id", "actor_type", "actor_id");
CREATE INDEX "organization_members_organization_id_role_idx"
  ON "organization_members"("organization_id", "role");
ALTER TABLE "organization_members"
  ADD CONSTRAINT "organization_members_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_api_keys" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "key_prefix" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL,
  "scopes" TEXT[],
  "rate_limit" INTEGER NOT NULL DEFAULT 60,
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_api_keys_key_hash_key" ON "organization_api_keys"("key_hash");
CREATE INDEX "organization_api_keys_organization_id_revoked_at_idx"
  ON "organization_api_keys"("organization_id", "revoked_at");
ALTER TABLE "organization_api_keys"
  ADD CONSTRAINT "organization_api_keys_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "outbound_webhooks" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "event_types" TEXT[],
  "secret_ciphertext" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "outbound_webhooks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "outbound_webhooks_organization_id_is_active_idx"
  ON "outbound_webhooks"("organization_id", "is_active");
ALTER TABLE "outbound_webhooks"
  ADD CONSTRAINT "outbound_webhooks_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "outbound_webhook_deliveries" (
  "id" TEXT NOT NULL,
  "webhook_id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "response_status" INTEGER,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "outbound_webhook_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "outbound_webhook_deliveries_webhook_id_event_id_key"
  ON "outbound_webhook_deliveries"("webhook_id", "event_id");
CREATE INDEX "outbound_webhook_deliveries_status_next_attempt_at_idx"
  ON "outbound_webhook_deliveries"("status", "next_attempt_at");
ALTER TABLE "outbound_webhook_deliveries"
  ADD CONSTRAINT "outbound_webhook_deliveries_webhook_id_fkey"
  FOREIGN KEY ("webhook_id") REFERENCES "outbound_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_branding" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "display_name" TEXT,
  "logo_url" TEXT,
  "primary_color" TEXT,
  "support_email" TEXT,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_branding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_branding_organization_id_key"
  ON "organization_branding"("organization_id");
ALTER TABLE "organization_branding"
  ADD CONSTRAINT "organization_branding_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "school_memberships" (
  "id" TEXT NOT NULL,
  "school_id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "permissions" TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "school_memberships_school_id_actor_type_actor_id_key"
  ON "school_memberships"("school_id", "actor_type", "actor_id");
CREATE INDEX "school_memberships_school_id_role_idx"
  ON "school_memberships"("school_id", "role");

ALTER TABLE "support_tickets"
  ADD COLUMN "response_due_at" TIMESTAMP(3),
  ADD COLUMN "first_responded_at" TIMESTAMP(3);
