import { NextRequest, NextResponse } from "next/server";

import { isCronRequestAuthorized } from "@/lib/cron/request-auth";
import db from "@/packages/db/client";
import { notifyBillingOwner } from "@/lib/billing/owner-notifications";

export async function GET(req: NextRequest) {
  if (!(await isCronRequestAuthorized(req))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const reminderWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [expiringPastDue, graceReminders] = await Promise.all([
    db.subscription.findMany({
      where: { status: "PAST_DUE", graceEndsAt: { lte: now } },
      select: { billingAccountId: true },
    }),
    db.subscription.findMany({
      where: {
        status: "PAST_DUE",
        graceEndsAt: { gt: now, lte: reminderWindowEnd },
        billingAccount: {
          notificationDeliveries: {
            none: { eventType: "subscription_grace_expiring" },
          },
        },
      },
      select: { billingAccountId: true, graceEndsAt: true },
    }),
  ]);
  const [pastDue, nonRenewing] = await db.$transaction([
    db.subscription.updateMany({
      where: {
        status: "PAST_DUE",
        graceEndsAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    }),
    db.subscription.updateMany({
      where: {
        status: "NON_RENEWING",
        currentPeriodEnd: { lte: now },
      },
      data: { status: "CANCELLED" },
    }),
  ]);
  await Promise.all(
    [
      ...graceReminders.map((subscription) =>
        notifyBillingOwner({
          billingAccountId: subscription.billingAccountId,
          eventType: "subscription_grace_expiring",
          message: `Your PocketShuttle payment grace period ends ${subscription.graceEndsAt?.toLocaleString("en-NG")}. Update payment details to keep Pro automation active.`,
        })
      ),
      ...expiringPastDue.map((subscription) =>
      notifyBillingOwner({
        billingAccountId: subscription.billingAccountId,
        eventType: "subscription_grace_expired",
        message:
          "Your PocketShuttle grace period ended and the account has returned to the Free plan. Critical safety access remains available.",
      })
      ),
    ]
  );
  return NextResponse.json({
    expiredPastDue: pastDue.count,
    completedCancellations: nonRenewing.count,
    graceReminders: graceReminders.length,
  });
}
