import { NextRequest, NextResponse } from "next/server";

import { ensurePlanCatalog } from "@/lib/billing/accounts";
import { paystackEnvironmentFromSecret } from "@/lib/billing/provider-environment";
import db from "@/packages/db/client";

export async function GET(req: NextRequest) {
  await ensurePlanCatalog();
  const audienceValue = req.nextUrl.searchParams.get("audience")?.toUpperCase();
  const audience =
    audienceValue === "FAMILY" || audienceValue === "SCHOOL" ? audienceValue : null;

  if (!audience) {
    return NextResponse.json(
      { message: "audience must be family or school" },
      { status: 400 }
    );
  }

  const plans = await db.plan.findMany({
    where: {
      isActive: true,
      isPublic: true,
      audience: { in: [audience, "ENTERPRISE"] },
    },
    include: {
      prices: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { providerPlans: { where: { isActive: true } } },
      },
    },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    plans: plans.map((plan) => {
      const price = plan.prices[0];
      const environment = paystackEnvironmentFromSecret();
      const providerPlan = price?.providerPlans.find(
        (item) => item.provider === "PAYSTACK" && item.environment === environment
      );
      const checkoutReady = Boolean(
        plan.isPurchasable &&
          providerPlan?.providerPlanCode &&
          process.env.PAYSTACK_SECRET_KEY
      );

      return {
        code: plan.code,
        name: plan.name,
        audience: plan.audience,
        tier: plan.tier,
        description: plan.description,
        features: plan.features,
        entitlements: plan.entitlements,
        isPurchasable: checkoutReady,
        checkoutState:
          plan.tier === "FREE"
            ? "INCLUDED"
            : checkoutReady
              ? "READY"
              : !providerPlan?.providerPlanCode || !process.env.PAYSTACK_SECRET_KEY
                ? "PAYSTACK_SETUP_REQUIRED"
                : "CLOSED",
        price: price
          ? {
              amountMinor: price.amountMinor,
              currency: price.currency,
              interval: price.interval,
            }
          : null,
      };
    }),
  });
}
