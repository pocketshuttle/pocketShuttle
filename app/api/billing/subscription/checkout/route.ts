import { NextRequest, NextResponse } from "next/server";

import { PLAN_CODES } from "@/lib/billing/catalog";
import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import db from "@/packages/db/client";
import {
  BILLING_ROLLOUT_FLAGS,
  hasBillingRolloutFlag,
} from "@/lib/billing/rollout";
import { assertRateLimit, assertSameOrigin } from "@/lib/admin/request-security";
import { paystackEnvironmentFromSecret } from "@/lib/billing/provider-environment";

const paidPlanCodes = new Set([
  PLAN_CODES.PRO_FAMILY,
  PLAN_CODES.SCHOOL_PRO,
]);

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const { account } = await requireBillingIdentity();
    assertRateLimit(`billing-checkout:${account.id}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (
      !hasBillingRolloutFlag(
        account.rolloutFlags,
        BILLING_ROLLOUT_FLAGS.PAID_CHECKOUT
      )
    ) {
      return NextResponse.json(
        {
          code: "ROLLOUT_NOT_ENABLED",
          message: "Paid subscriptions are not enabled for this account yet.",
        },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const planCode = String(body.planCode || "");

    if (!paidPlanCodes.has(planCode as never)) {
      return NextResponse.json({ message: "Invalid paid plan" }, { status: 400 });
    }

    const expectedAudience = account.type === "FAMILY" ? "FAMILY" : "SCHOOL";
    const plan = await db.plan.findFirst({
      where: {
        code: planCode,
        audience: expectedAudience,
        isActive: true,
        isPublic: true,
        isPurchasable: true,
      },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { providerPlans: { where: { isActive: true } } },
        },
      },
    });
    const price = plan?.prices[0];
    const environment = paystackEnvironmentFromSecret();
    const providerPlan = price?.providerPlans.find(
      (item) => item.provider === "PAYSTACK" && item.environment === environment
    );

    if (!plan || !price || !providerPlan) {
      return NextResponse.json(
        { message: "This plan is not available for checkout yet" },
        { status: 409 }
      );
    }
    if (!account.billingEmail) {
      return NextResponse.json(
        { message: "Add a billing email before upgrading" },
        { status: 400 }
      );
    }
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { message: "Paystack billing is not configured" },
        { status: 503 }
      );
    }

    const existingPaid = await db.subscription.findFirst({
      where: {
        billingAccountId: account.id,
        status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "NON_RENEWING"] },
        plan: { tier: { in: ["PRO", "ENTERPRISE"] } },
      },
      select: { id: true },
    });
    if (existingPaid) {
      return NextResponse.json(
        { message: "Manage or cancel the current paid subscription before changing plans" },
        { status: 409 }
      );
    }

    const reference = `ps_sub_${account.id}_${Date.now()}`;
    const callbackBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: account.billingEmail,
        amount: price.amountMinor,
        currency: price.currency,
        plan: providerPlan.providerPlanCode,
        reference,
        ...(callbackBase
          ? { callback_url: `${callbackBase.replace(/\/$/, "")}/billing/return` }
          : {}),
        metadata: {
          product: "platform_subscription",
          billingAccountId: account.id,
          planCode: plan.code,
          planPriceId: price.id,
          providerEnvironment: environment,
        },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.data?.authorization_url) {
      return NextResponse.json(
        { message: payload?.message || "Unable to initialize subscription" },
        { status: 502 }
      );
    }

    await db.billingPaymentAttempt.create({
      data: {
        billingAccountId: account.id,
        planPriceId: price.id,
        providerPlanId: providerPlan.id,
        providerEnvironment: providerPlan.environment,
        providerReference: reference,
        amountMinor: price.amountMinor,
        currency: price.currency,
        authorizationUrl: payload.data.authorization_url,
        metadata: {
          planCode: plan.code,
          accessCode: payload.data.access_code ?? null,
        },
      },
    });

    return NextResponse.json({
      authorizationUrl: payload.data.authorization_url,
      reference,
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
