import "server-only";

import {
  ResolvedEntitlements,
  assertWithinLimit,
  requireFeature,
} from "@/lib/billing/entitlements";
import db from "@/packages/db/client";

function currentPeriodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function consumePremiumMessage(
  resolved: ResolvedEntitlements,
  channel: "sms" | "whatsapp"
) {
  requireFeature(resolved, "premium_notifications");
  const periodKey = currentPeriodKey();

  return db.$transaction(async (tx) => {
    const usage = await tx.premiumMessageUsage.findUnique({
      where: {
        billingAccountId_periodKey_channel: {
          billingAccountId: resolved.billingAccountId,
          periodKey,
          channel,
        },
      },
    });
    assertWithinLimit(
      resolved,
      "premium_messages_per_month",
      usage?.count ?? 0
    );
    return tx.premiumMessageUsage.upsert({
      where: {
        billingAccountId_periodKey_channel: {
          billingAccountId: resolved.billingAccountId,
          periodKey,
          channel,
        },
      },
      create: {
        billingAccountId: resolved.billingAccountId,
        periodKey,
        channel,
        count: 1,
      },
      update: { count: { increment: 1 } },
    });
  });
}
