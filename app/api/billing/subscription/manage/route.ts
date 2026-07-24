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
        providerSubscriptionCode: { not: null },
        status: { in: ["ACTIVE", "PAST_DUE", "NON_RENEWING"] },
      },
      orderBy: { startDate: "desc" },
    });

    if (!subscription?.providerSubscriptionCode) {
      return NextResponse.json(
        { message: "No managed subscription was found" },
        { status: 404 }
      );
    }
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { message: "Paystack billing is not configured" },
        { status: 503 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/subscription/${encodeURIComponent(
        subscription.providerSubscriptionCode
      )}/manage/link`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.data?.link) {
      return NextResponse.json(
        { message: payload?.message || "Unable to open subscription management" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: payload.data.link });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
