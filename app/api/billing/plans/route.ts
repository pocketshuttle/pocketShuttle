import { NextRequest, NextResponse } from "next/server";

import { ensurePlanCatalog } from "@/lib/billing/accounts";
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
      },
    },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    plans: plans.map((plan) => ({
      code: plan.code,
      name: plan.name,
      audience: plan.audience,
      tier: plan.tier,
      description: plan.description,
      features: plan.features,
      entitlements: plan.entitlements,
      isPurchasable: plan.isPurchasable,
      price: plan.prices[0]
        ? {
            amountMinor: plan.prices[0].amountMinor,
            currency: plan.prices[0].currency,
            interval: plan.prices[0].interval,
          }
        : null,
    })),
  });
}
