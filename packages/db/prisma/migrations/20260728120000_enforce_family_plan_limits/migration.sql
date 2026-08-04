ALTER TABLE "billing_accounts"
  ALTER COLUMN "enforcement_enabled" SET DEFAULT true;

UPDATE "billing_accounts"
SET
  "enforcement_enabled" = true,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "type" = 'FAMILY'
  AND "enforcement_enabled" = false;
