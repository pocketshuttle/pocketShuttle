import { NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import { getEntitlements, historyCutoff } from "@/lib/billing/entitlements";
import { getBillingUsage } from "@/lib/billing/usage";
import { ensureFamilyBillingAccount } from "@/lib/billing/accounts";
import db from "@/packages/db/client";

export async function GET() {
  const session = await getApiSession();
  if (!isParent(session) || session.schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [account, resolved] = await Promise.all([
    ensureFamilyBillingAccount(session.id),
    getEntitlements(session),
  ]);
  const cutoff = historyCutoff(resolved);
  const [usage, places, templates, trips, preferences, deliveries] = await Promise.all([
    getBillingUsage(account, resolved),
    db.customPlace.findMany({
      where: { billingAccountId: account.id },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    db.tripTemplate.findMany({
      where: { billingAccountId: account.id },
      orderBy: { createdAt: "desc" },
    }),
    db.trip.findMany({
      where: {
        createdBy: session.id,
        schoolId: null,
        ...(cutoff
          ? {
              OR: [
                { status: { in: ["scheduled", "active", "paused", "emergency"] } },
                { createdAt: { gte: cutoff } },
              ],
            }
          : {}),
      },
      include: {
        viewers: true,
        viewerInvites: { orderBy: { createdAt: "desc" } },
        events: {
          where: {
            eventType: {
              in: ["eta_updated", "route_deviation", "unusual_stop", "stop_reached"],
            },
          },
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.billingNotificationPreference.findMany({
      where: { billingAccountId: account.id },
    }),
    db.notificationDelivery.findMany({
      where: { billingAccountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);
  return NextResponse.json({
    plan: {
      code: resolved.planCode,
      name: resolved.planName,
      status: resolved.status,
      entitlements: resolved.entitlements,
      historyCutoff: cutoff,
    },
    usage,
    places,
    templates,
    trips,
    preferences,
    deliveries,
  });
}
