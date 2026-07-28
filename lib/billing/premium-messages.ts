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

export async function assertPremiumMessageAvailable(
  resolved: ResolvedEntitlements,
  _channel: "sms" | "whatsapp"
) {
  requireFeature(resolved, "premium_notifications");
  const usage = await db.premiumMessageUsage.aggregate({
    where: {
      billingAccountId: resolved.billingAccountId,
      periodKey: currentPeriodKey(),
    },
    _sum: { count: true },
  });
  assertWithinLimit(
    resolved,
    "premium_messages_per_month",
    usage._sum.count ?? 0
  );
}

export async function consumePremiumMessage(
  resolved: ResolvedEntitlements,
  _channel: "sms" | "whatsapp"
) {
  requireFeature(resolved, "premium_notifications");
  const periodKey = currentPeriodKey();

  return db.$transaction(async (tx) => {
    const usage = await tx.premiumMessageUsage.aggregate({
      where: { billingAccountId: resolved.billingAccountId, periodKey },
      _sum: { count: true },
    });
    assertWithinLimit(
      resolved,
      "premium_messages_per_month",
      usage._sum.count ?? 0
    );
    return tx.premiumMessageUsage.upsert({
      where: {
        billingAccountId_periodKey_channel: {
          billingAccountId: resolved.billingAccountId,
          periodKey,
          channel: "all",
        },
      },
      create: {
        billingAccountId: resolved.billingAccountId,
        periodKey,
        channel: "all",
        count: 1,
      },
      update: { count: { increment: 1 } },
    });
  });
}

export async function releasePremiumMessage(
  billingAccountId: string,
  _channel: string,
  acceptedAt = new Date()
) {
  const periodKey = `${acceptedAt.getUTCFullYear()}-${String(
    acceptedAt.getUTCMonth() + 1
  ).padStart(2, "0")}`;
  await db.premiumMessageUsage.updateMany({
    where: {
      billingAccountId,
      periodKey,
      channel: "all",
      count: { gt: 0 },
    },
    data: { count: { decrement: 1 } },
  });
}
