import "server-only";

import { Prisma } from "@prisma/client";

import db from "@/packages/db/client";
import {
  PLAN_CATALOG,
  PLAN_CODES,
  PlanCode,
  defaultFreePlanCode,
} from "@/lib/billing/catalog";
import { defaultBillingEnforcement } from "@/lib/billing/policy";

export async function ensurePlanCatalog() {
  await Promise.all(
    Object.values(PLAN_CATALOG).map((definition) =>
      db.plan.upsert({
        where: { code: definition.code },
        create: {
          code: definition.code,
          name: definition.name,
          price: 0,
          duration: 30,
          description: definition.description,
          features: definition.marketingFeatures,
          entitlements: definition.entitlements as Prisma.InputJsonValue,
          audience: definition.audience,
          tier: definition.tier,
          isActive: true,
          isPublic: definition.isPublic,
          isPurchasable: definition.isPurchasable,
        },
        update: {
          description: definition.description,
          features: definition.marketingFeatures,
          entitlements: definition.entitlements as Prisma.InputJsonValue,
          audience: definition.audience,
          tier: definition.tier,
        },
      })
    )
  );
}

async function ensureFreeSubscription(input: {
  billingAccountId: string;
  audience: "FAMILY" | "SCHOOL";
  userId?: string;
}) {
  const code = defaultFreePlanCode(input.audience);
  const plan = await db.plan.findUnique({ where: { code }, select: { id: true } });
  if (!plan) throw new Error(`Default plan ${code} is unavailable`);

  const existing = await db.subscription.findFirst({
    where: {
      billingAccountId: input.billingAccountId,
      planId: plan.id,
      status: { in: ["ACTIVE", "TRIALING", "NON_RENEWING"] },
    },
    select: { id: true },
  });

  if (existing) return existing;

  return db.subscription.create({
    data: {
      billingAccountId: input.billingAccountId,
      userId: input.userId,
      planId: plan.id,
      subscriptionPlan: "FREE",
      provider: "MANUAL",
      status: "ACTIVE",
    },
    select: { id: true },
  });
}

export async function ensureSchoolBillingAccount(userId: string) {
  await ensurePlanCatalog();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) throw new Error("School account not found");

  const account = await db.billingAccount.upsert({
    where: { userId },
    create: {
      type: "SCHOOL",
      userId,
      billingEmail: user.email,
      enforcementEnabled: defaultBillingEnforcement("SCHOOL"),
    },
    update: {
      billingEmail: user.email,
    },
  });
  await ensureFreeSubscription({
    billingAccountId: account.id,
    audience: "SCHOOL",
    userId,
  });
  return account;
}

export async function ensureFamilyBillingAccount(parentId: string) {
  await ensurePlanCatalog();
  const parent = await db.parent.findFirst({
    where: { id: parentId, accountType: "STANDALONE", schoolId: null },
    select: { id: true, email: true },
  });
  if (!parent) throw new Error("Standalone parent account not found");

  const account = await db.billingAccount.upsert({
    where: { parentId },
    create: {
      type: "FAMILY",
      parentId,
      billingEmail: parent.email,
      enforcementEnabled: defaultBillingEnforcement("FAMILY"),
    },
    update: {
      billingEmail: parent.email,
    },
  });
  await ensureFreeSubscription({
    billingAccountId: account.id,
    audience: "FAMILY",
  });
  return account;
}

export async function ensureBillingAccountForIdentity(input: {
  id: string;
  role: string;
  schoolId?: string | null;
}) {
  const role = input.role.toLowerCase();
  if (role === "parent" && !input.schoolId) {
    return ensureFamilyBillingAccount(input.id);
  }

  const schoolId =
    input.schoolId ?? (role === "admin" || role === "school" ? input.id : null);
  if (!schoolId) throw new Error("This account does not own a subscription");
  return ensureSchoolBillingAccount(schoolId);
}

export function planCodeToLegacyTier(code: PlanCode) {
  if (code === PLAN_CODES.ENTERPRISE) return "ENTERPRISE" as const;
  if (code === PLAN_CODES.PRO_FAMILY || code === PLAN_CODES.SCHOOL_PRO) return "PRO" as const;
  return "FREE" as const;
}
