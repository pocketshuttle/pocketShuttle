CREATE TYPE "PlatformAdminRole" AS ENUM ('OWNER', 'ADMIN', 'SUPPORT', 'BILLING', 'READ_ONLY');
CREATE TYPE "PlatformAdminStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "PlatformAdminInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "PlatformAdminInviteDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "PlatformAdminWorkspaceReason" AS ENUM ('SUPPORT', 'ONBOARDING', 'BILLING_INVESTIGATION', 'DATA_CORRECTION');
CREATE TYPE "PlatformAdminSubjectType" AS ENUM ('SCHOOL', 'PARENT', 'DRIVER', 'TEACHER');

ALTER TABLE "SuperUser"
  ADD COLUMN "access_role" "PlatformAdminRole" NOT NULL DEFAULT 'ADMIN',
  ADD COLUMN "status" "PlatformAdminStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "last_login_at" TIMESTAMP(3),
  ADD COLUMN "disabled_at" TIMESTAMP(3),
  ADD COLUMN "invited_by_id" TEXT;

UPDATE "SuperUser"
SET "access_role" = 'OWNER'
WHERE "id" = (
  SELECT "id"
  FROM "SuperUser"
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
);

ALTER TABLE "SuperUser"
  ADD CONSTRAINT "SuperUser_invited_by_id_fkey"
  FOREIGN KEY ("invited_by_id") REFERENCES "SuperUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SuperUser_status_access_role_idx"
  ON "SuperUser"("status", "access_role");

CREATE TABLE "platform_admin_invites" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "access_role" "PlatformAdminRole" NOT NULL,
  "token_hash" TEXT NOT NULL,
  "status" "PlatformAdminInviteStatus" NOT NULL DEFAULT 'PENDING',
  "delivery_status" "PlatformAdminInviteDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "delivery_error" TEXT,
  "invited_by_id" TEXT NOT NULL,
  "accepted_by_id" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_admin_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_admin_invites_token_hash_key"
  ON "platform_admin_invites"("token_hash");
CREATE INDEX "platform_admin_invites_email_status_idx"
  ON "platform_admin_invites"("email", "status");
CREATE INDEX "platform_admin_invites_invited_by_id_created_at_idx"
  ON "platform_admin_invites"("invited_by_id", "created_at");

ALTER TABLE "platform_admin_invites"
  ADD CONSTRAINT "platform_admin_invites_invited_by_id_fkey"
  FOREIGN KEY ("invited_by_id") REFERENCES "SuperUser"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "platform_admin_invites"
  ADD CONSTRAINT "platform_admin_invites_accepted_by_id_fkey"
  FOREIGN KEY ("accepted_by_id") REFERENCES "SuperUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "platform_admin_workspace_sessions" (
  "id" TEXT NOT NULL,
  "super_user_id" TEXT NOT NULL,
  "subject_type" "PlatformAdminSubjectType" NOT NULL,
  "subject_id" TEXT NOT NULL,
  "subject_role" TEXT NOT NULL,
  "subject_name" TEXT,
  "school_id" TEXT,
  "reason" "PlatformAdminWorkspaceReason" NOT NULL,
  "note" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_admin_workspace_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_admin_workspace_sessions_super_user_id_ended_at_expires_at_idx"
  ON "platform_admin_workspace_sessions"("super_user_id", "ended_at", "expires_at");
CREATE INDEX "platform_admin_workspace_sessions_subject_type_subject_id_created_at_idx"
  ON "platform_admin_workspace_sessions"("subject_type", "subject_id", "created_at");

ALTER TABLE "platform_admin_workspace_sessions"
  ADD CONSTRAINT "platform_admin_workspace_sessions_super_user_id_fkey"
  FOREIGN KEY ("super_user_id") REFERENCES "SuperUser"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SuperUserAction"
  ADD COLUMN "workspace_session_id" TEXT;

CREATE INDEX "SuperUserAction_workspace_session_id_createdAt_idx"
  ON "SuperUserAction"("workspace_session_id", "createdAt");

ALTER TABLE "SuperUserAction"
  ADD CONSTRAINT "SuperUserAction_workspace_session_id_fkey"
  FOREIGN KEY ("workspace_session_id") REFERENCES "platform_admin_workspace_sessions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
