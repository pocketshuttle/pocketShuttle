import { NextResponse } from "next/server";

import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import db from "@/packages/db/client";

export async function POST() {
  try {
    const { account } = await requireBillingIdentity();
    const subscription = await db.subscription.findFirst({
      where: {
        billingAccountId: account.id,
        status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
        providerSubscriptionCode: { not: null },
      },
      include: { plan: { select: { tier: true } } },
      orderBy: { startDate: "desc" },
    });

    if (!subscription || subscription.plan.tier === "FREE") {
      return NextResponse.json(
        { message: "No paid subscription is available to cancel" },
        { status: 404 }
      );
    }
    if (!process.env.PAYSTACK_SECRET_KEY || !subscription.providerEmailToken) {
      return NextResponse.json(
        { message: "Subscription management is not available" },
        { status: 503 }
      );
    }

    const response = await fetch("https://api.paystack.co/subscription/disable", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: subscription.providerSubscriptionCode,
        token: subscription.providerEmailToken,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: payload?.message || "Unable to cancel subscription" },
        { status: 502 }
      );
    }

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "NON_RENEWING",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Subscription will end after the current billing period",
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
