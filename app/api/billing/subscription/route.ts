import { NextResponse } from "next/server";

import { getEntitlements } from "@/lib/billing/entitlements";
import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import db from "@/packages/db/client";
import {
  BILLING_ROLLOUT_FLAGS,
  hasBillingRolloutFlag,
} from "@/lib/billing/rollout";

export async function GET() {
  try {
    const { session, account } = await requireBillingIdentity();
    const [resolved, subscriptions, payments] = await Promise.all([
      getEntitlements(session),
      db.subscription.findMany({
        where: { billingAccountId: account.id },
        include: {
          plan: { select: { code: true, name: true, tier: true } },
          planPrice: {
            select: { amountMinor: true, currency: true, interval: true },
          },
        },
        orderBy: { startDate: "desc" },
      }),
      db.billingPaymentAttempt.findMany({
        where: { billingAccountId: account.id },
        select: {
          id: true,
          providerReference: true,
          amountMinor: true,
          currency: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

    return NextResponse.json({
      billingAccount: {
        id: account.id,
        type: account.type,
        billingEmail: account.billingEmail,
        enforcementEnabled: account.enforcementEnabled,
        paidCheckoutEnabled: hasBillingRolloutFlag(
          account.rolloutFlags,
          BILLING_ROLLOUT_FLAGS.PAID_CHECKOUT
        ),
      },
      current: resolved,
      subscriptions,
      payments,
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
