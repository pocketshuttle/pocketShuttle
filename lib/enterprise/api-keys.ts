import "server-only";

import crypto from "crypto";
import { NextRequest } from "next/server";

import db from "@/packages/db/client";

export const ENTERPRISE_API_SCOPES = [
  "trips:read",
  "trips:write",
  "locations:write",
  "events:read",
  "reports:read",
  "branches:read",
] as const;

export function generateApiKey() {
  const secret = crypto.randomBytes(32).toString("base64url");
  const prefix = crypto.randomBytes(6).toString("hex");
  const token = `ps_live_${prefix}.${secret}`;
  return {
    token,
    prefix: `ps_live_${prefix}`,
    hash: crypto.createHash("sha256").update(token).digest("hex"),
  };
}

export async function authenticateEnterpriseApiKey(
  req: NextRequest,
  requiredScope: (typeof ENTERPRISE_API_SCOPES)[number]
) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token.startsWith("ps_live_")) return null;
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const apiKey = await db.organizationApiKey.findUnique({
    where: { keyHash: hash },
    include: {
      organization: {
        include: { billingAccount: { include: { subscriptions: { include: { plan: true } } } } },
      },
    },
  });
  if (!apiKey || apiKey.revokedAt || !apiKey.scopes.includes(requiredScope)) return null;
  const enterpriseActive = apiKey.organization.billingAccount?.subscriptions.some(
    (subscription) =>
      subscription.plan.tier === "ENTERPRISE" &&
      ["ACTIVE", "TRIALING", "NON_RENEWING"].includes(subscription.status) &&
      (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date())
  );
  if (!enterpriseActive) return null;
  await db.organizationApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });
  return {
    organizationId: apiKey.organizationId,
    apiKeyId: apiKey.id,
    scopes: apiKey.scopes,
    rateLimit: apiKey.rateLimit,
  };
}
