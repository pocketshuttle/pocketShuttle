import "server-only";

import { cache } from "react";

import { ApiSession } from "@/lib/api-auth";
import { ensureBillingAccountForIdentity } from "@/lib/billing/accounts";
import {
  EntitlementMap,
  FeatureKey,
  LimitKey,
  PlanCode,
  defaultFreePlanCode,
  normalizeEntitlements,
  requiredPlanFor,
} from "@/lib/billing/catalog";
import db from "@/packages/db/client";
import {
  historyCutoffForHours,
  isUsableSubscription,
  limitAllows,
} from "@/lib/billing/policy";

type BillingAudience = "FAMILY" | "SCHOOL";

export type ResolvedEntitlements = {
  billingAccountId: string;
  audience: BillingAudience;
  planCode: PlanCode;
  planName: string;
  status: string;
  enforcementEnabled: boolean;
  entitlements: EntitlementMap;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
};

function tierWeight(tier: string) {
  if (tier === "ENTERPRISE") return 3;
  if (tier === "PRO") return 2;
  return 1;
}

export const getEntitlements = cache(async (session: ApiSession): Promise<ResolvedEntitlements> => {
  const account = await ensureBillingAccountForIdentity(session);
  const audience: BillingAudience = account.type === "FAMILY" ? "FAMILY" : "SCHOOL";
  const subscriptions = await db.subscription.findMany({
    where: { billingAccountId: account.id },
    include: { plan: true },
    orderBy: { startDate: "desc" },
  });

  const usable = subscriptions
    .filter((item) =>
      isUsableSubscription(item.status, item.currentPeriodEnd ?? item.endDate, item.graceEndsAt)
    )
    .sort((left, right) => tierWeight(right.plan.tier) - tierWeight(left.plan.tier));
  const selected =
    usable[0] ??
    subscriptions.find((item) => item.plan.code === defaultFreePlanCode(audience));

  if (!selected) throw new Error("Default subscription is unavailable");

  return {
    billingAccountId: account.id,
    audience,
    planCode: selected.plan.code as PlanCode,
    planName: selected.plan.name,
    status: selected.status,
    enforcementEnabled: account.enforcementEnabled,
    entitlements: {
      ...normalizeEntitlements(selected.plan.entitlements),
      ...normalizeEntitlements(account.entitlementOverrides),
    },
    currentPeriodEnd: selected.currentPeriodEnd ?? selected.endDate,
    graceEndsAt: selected.graceEndsAt,
  };
});

export function hasFeature(resolved: ResolvedEntitlements, feature: FeatureKey) {
  return resolved.entitlements[feature] === true;
}

export class EntitlementError extends Error {
  code = "UPGRADE_REQUIRED" as const;

  constructor(
    public feature: FeatureKey | LimitKey,
    public current: number | null,
    public limit: number | null,
    public requiredPlan: PlanCode
  ) {
    super("Your current plan does not include this feature.");
  }
}

function enforceOrShadow(
  resolved: ResolvedEntitlements,
  error: EntitlementError
) {
  if (resolved.enforcementEnabled) throw error;
  console.warn("[entitlements:shadow]", {
    billingAccountId: resolved.billingAccountId,
    planCode: resolved.planCode,
    feature: error.feature,
    current: error.current,
    limit: error.limit,
  });
}

export function requireFeature(resolved: ResolvedEntitlements, feature: FeatureKey) {
  if (hasFeature(resolved, feature)) return;
  enforceOrShadow(
    resolved,
    new EntitlementError(feature, null, null, requiredPlanFor(feature, resolved.audience))
  );
}

export function assertWithinLimit(
  resolved: ResolvedEntitlements,
  key: LimitKey,
  current: number,
  increment = 1
) {
  const value = resolved.entitlements[key];
  if (limitAllows(value, current, increment)) return;
  const limit = typeof value === "number" ? value : 0;
  enforceOrShadow(
    resolved,
    new EntitlementError(key, current, limit, requiredPlanFor(key, resolved.audience))
  );
}

export function historyCutoff(resolved: ResolvedEntitlements) {
  return historyCutoffForHours(resolved.entitlements.history_hours);
}

export function entitlementErrorBody(error: EntitlementError) {
  return {
    code: error.code,
    message: error.message,
    feature: error.feature,
    current: error.current,
    limit: error.limit,
    requiredPlan: error.requiredPlan,
  };
}
