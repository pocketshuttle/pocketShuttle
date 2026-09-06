CREATE TYPE "MobileSubjectRole" AS ENUM ('PARENT', 'DRIVER', 'TEACHER');
CREATE TYPE "MobilePlatform" AS ENUM ('ANDROID', 'IOS');

CREATE TABLE "mobile_devices" (
  "id" TEXT NOT NULL,
  "subject_role" "MobileSubjectRole" NOT NULL,
  "subject_id" TEXT NOT NULL,
  "installation_id" TEXT NOT NULL,
  "platform" "MobilePlatform" NOT NULL,
  "name" TEXT,
  "app_version" TEXT,
  "onesignal_subscription_id" TEXT,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mobile_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_devices_subject_role_subject_id_installation_id_key"
  ON "mobile_devices"("subject_role", "subject_id", "installation_id");
CREATE INDEX "mobile_devices_subject_role_subject_id_revoked_at_idx"
  ON "mobile_devices"("subject_role", "subject_id", "revoked_at");
CREATE INDEX "mobile_devices_onesignal_subscription_id_idx"
  ON "mobile_devices"("onesignal_subscription_id");

CREATE TABLE "mobile_sessions" (
  "id" TEXT NOT NULL,
  "subject_role" "MobileSubjectRole" NOT NULL,
  "subject_id" TEXT NOT NULL,
  "school_id" TEXT,
  "device_id" TEXT NOT NULL,
  "refresh_token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  "rotated_to_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mobile_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_sessions_refresh_token_hash_key"
  ON "mobile_sessions"("refresh_token_hash");
CREATE INDEX "mobile_sessions_subject_role_subject_id_revoked_at_expires_at_idx"
  ON "mobile_sessions"("subject_role", "subject_id", "revoked_at", "expires_at");
CREATE INDEX "mobile_sessions_device_id_revoked_at_idx"
  ON "mobile_sessions"("device_id", "revoked_at");

ALTER TABLE "mobile_sessions"
  ADD CONSTRAINT "mobile_sessions_device_id_fkey"
  FOREIGN KEY ("device_id") REFERENCES "mobile_devices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "mobile_event_receipts" (
  "id" TEXT NOT NULL,
  "client_event_id" TEXT NOT NULL,
  "subject_role" "MobileSubjectRole" NOT NULL,
  "subject_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "result" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mobile_event_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_event_receipts_client_event_id_key"
  ON "mobile_event_receipts"("client_event_id");
CREATE INDEX "mobile_event_receipts_subject_role_subject_id_created_at_idx"
  ON "mobile_event_receipts"("subject_role", "subject_id", "created_at");
