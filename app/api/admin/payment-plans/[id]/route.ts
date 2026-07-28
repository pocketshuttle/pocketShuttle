import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { logSuperUserAction, requirePlatformPermission } from "@/lib/admin/platform";
import {
  FEATURE_KEYS,
  LIMIT_KEYS,
  normalizeEntitlements,
} from "@/lib/billing/catalog";
import { createPaystackMonthlyPlan } from "@/lib/billing/paystack";
import { paystackEnvironmentFromSecret } from "@/lib/billing/provider-environment";
import db from "@/packages/db/client";

type Params = { id: string };
const allowedKeys = new Set<string>([...FEATURE_KEYS, ...LIMIT_KEYS]);

function parseFeatures(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
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
  if (unknown.length) throw new Error(`Unknown entitlement keys: ${unknown.join(", ")}`);
  return normalizeEntitlements(source);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    assertSameOrigin(req);
    const session = await requirePlatformPermission("plans.manage");
    const body = await req.json();
    const { id } = await params;
    const current = await db.plan.findUnique({
      where: { id },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { providerPlans: true },
        },
      },
    });
    if (!current) throw new Error("Plan not found");

    const amountMinor =
      body.amountMinor !== undefined
        ? Math.max(0, Math.round(Number(body.amountMinor)))
        : undefined;
    const currency = String(body.currency || current.prices[0]?.currency || "NGN").toUpperCase();
    const requestedPurchasable =
      body.isPurchasable !== undefined
        ? Boolean(body.isPurchasable)
        : current.isPurchasable;
    const currentPrice = current.prices[0];
    const configuredEnvironment = paystackEnvironmentFromSecret();
    const currentProviderPlan = currentPrice?.providerPlans.find(
      (providerPlan) =>
        providerPlan.provider === "PAYSTACK" &&
        providerPlan.environment === configuredEnvironment &&
        providerPlan.isActive
    );
    const effectiveAmountMinor = amountMinor ?? currentPrice?.amountMinor ?? 0;
    const priceChanged =
      amountMinor !== undefined &&
      amountMinor > 0 &&
      amountMinor !== currentPrice?.amountMinor;
    const providerSyncRequired =
      effectiveAmountMinor > 0 &&
      Boolean(configuredEnvironment) &&
      !currentProviderPlan &&
      (amountMinor !== undefined || requestedPurchasable);
    let providerPlan: Awaited<ReturnType<typeof createPaystackMonthlyPlan>> = null;
    if (priceChanged || providerSyncRequired) {
      providerPlan = await createPaystackMonthlyPlan({
        name: body.name ? String(body.name) : current.name,
        amountMinor: effectiveAmountMinor,
        currency,
      });
    }

    const plan = await db.$transaction(async (tx) => {
      if (priceChanged) {
        await tx.planPrice.updateMany({
          where: { planId: id, isActive: true },
          data: { isActive: false },
        });
        const price = await tx.planPrice.create({
          data: {
            planId: id,
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
      } else if (providerPlan && currentPrice && !currentProviderPlan) {
        await tx.billingProviderPlan.create({
          data: {
            planPriceId: currentPrice.id,
            provider: "PAYSTACK",
            environment: providerPlan.environment,
            providerPlanCode: providerPlan.planCode,
          },
        });
      }

      const activeProviderAvailable = priceChanged
        ? Boolean(providerPlan)
        : Boolean(
            providerPlan ||
              currentPrice?.providerPlans.some(
                (item) =>
                  item.isActive && item.environment === configuredEnvironment
              )
          );
      if (
        requestedPurchasable &&
        current.tier !== "FREE" &&
        !activeProviderAvailable
      ) {
        throw new Error("Configure Paystack and a price before publishing checkout");
      }

      return tx.plan.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
          ...(amountMinor !== undefined ? { price: amountMinor / 100 } : {}),
          ...(body.description !== undefined
            ? { description: body.description ? String(body.description) : null }
            : {}),
          ...(body.features !== undefined
            ? { features: parseFeatures(body.features) }
            : {}),
          ...(body.entitlements !== undefined
            ? {
                entitlements: parseEntitlements(
                  body.entitlements
                ) as Prisma.InputJsonValue,
              }
            : {}),
          ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
          ...(body.isPublic !== undefined ? { isPublic: Boolean(body.isPublic) } : {}),
          ...(body.isPurchasable !== undefined
            ? { isPurchasable: Boolean(body.isPurchasable) }
            : {}),
        },
        include: {
          prices: {
            orderBy: { createdAt: "desc" },
            include: { providerPlans: { orderBy: { environment: "asc" } } },
          },
          _count: { select: { subscriptions: true } },
        },
      });
    });

    await logSuperUserAction({
      superUserId: session.id,
      action: "PAYMENT_PLAN_UPDATED",
      targetId: `plan:${plan.id}`,
      metadata: {
        code: plan.code,
        isActive: plan.isActive,
        isPublic: plan.isPublic,
        isPurchasable: plan.isPurchasable,
      },
    });

    return NextResponse.json({ message: "Plan updated", plan });
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
