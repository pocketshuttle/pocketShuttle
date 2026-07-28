import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { logSuperUserAction, requirePlatformPermission } from "@/lib/admin/platform";
import { ensurePlanCatalog } from "@/lib/billing/accounts";
import {
  FEATURE_KEYS,
  LIMIT_KEYS,
  normalizeEntitlements,
} from "@/lib/billing/catalog";
import { createPaystackMonthlyPlan } from "@/lib/billing/paystack";
import db from "@/packages/db/client";

const allowedKeys = new Set<string>([...FEATURE_KEYS, ...LIMIT_KEYS]);

function parseFeatures(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseEntitlements(value: unknown) {
  const source =
    typeof value === "string" && value.trim() ? JSON.parse(value) : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  const unknown = Object.keys(source).filter((key) => !allowedKeys.has(key));
  if (unknown.length) {
    throw new Error(`Unknown entitlement keys: ${unknown.join(", ")}`);
  }
  return normalizeEntitlements(source);
}

export async function GET() {
  try {
    await requirePlatformPermission("billing.read");
    await ensurePlanCatalog();
    const plans = await db.plan.findMany({
      include: {
        _count: { select: { subscriptions: true } },
        prices: {
          orderBy: { createdAt: "desc" },
          include: { providerPlans: { orderBy: { environment: "asc" } } },
        },
      },
      orderBy: [{ audience: "asc" }, { tier: "asc" }],
    });
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requirePlatformPermission("plans.manage");
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code)) {
      throw new Error("A stable uppercase plan code is required");
    }
    const audience = String(body.audience || "SCHOOL").toUpperCase();
    const tier = String(body.tier || "FREE").toUpperCase();
    if (!["FAMILY", "SCHOOL", "ENTERPRISE"].includes(audience)) {
      throw new Error("Invalid plan audience");
    }
    if (!["FREE", "PRO", "ENTERPRISE"].includes(tier)) {
      throw new Error("Invalid plan tier");
    }

    const amountMinor = Math.max(
      0,
      Math.round(Number(body.amountMinor ?? Number(body.price || 0) * 100))
    );
    const currency = String(body.currency || "NGN").toUpperCase();
    const entitlements = parseEntitlements(body.entitlements);
    const providerPlan =
      amountMinor > 0
        ? await createPaystackMonthlyPlan({
            name: String(body.name || code),
            amountMinor,
            currency,
          })
        : null;
    const requestedPurchasable = body.isPurchasable === true;
    if (requestedPurchasable && amountMinor > 0 && !providerPlan) {
      throw new Error("Configure Paystack before publishing a paid plan");
    }

    const plan = await db.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: {
          code,
          name: String(body.name || code).trim(),
          price: amountMinor / 100,
          duration: 30,
          description: body.description ? String(body.description) : null,
          features: parseFeatures(body.features),
          entitlements: entitlements as Prisma.InputJsonValue,
          audience: audience as "FAMILY" | "SCHOOL" | "ENTERPRISE",
          tier: tier as "FREE" | "PRO" | "ENTERPRISE",
          isActive: body.isActive !== false,
          isPublic: body.isPublic === true,
          isPurchasable: requestedPurchasable,
        },
      });
      if (amountMinor > 0) {
        const price = await tx.planPrice.create({
          data: {
            planId: created.id,
            amountMinor,
            currency,
          },
        });
        if (providerPlan) {
          await tx.billingProviderPlan.create({
            data: {
              planPriceId: price.id,
              provider: "PAYSTACK",
              environment: providerPlan.environment,
              providerPlanCode: providerPlan.planCode,
            },
          });
        }
      }
      return created;
    });

    await logSuperUserAction({
      superUserId: session.id,
      action: "PAYMENT_PLAN_CREATED",
      targetId: `plan:${plan.id}`,
      metadata: { code: plan.code, name: plan.name },
    });

    return NextResponse.json({ message: "Plan created", plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message !== "UNAUTHORIZED"
            ? error.message
            : "Unauthorized",
      },
      {
        status:
          error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401,
      }
    );
  }
}
