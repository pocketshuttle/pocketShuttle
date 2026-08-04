import "server-only";

import { BillingAccount } from "@prisma/client";

import { ResolvedEntitlements } from "@/lib/billing/entitlements";
import db from "@/packages/db/client";

function limitValue(
  resolved: ResolvedEntitlements,
  key: keyof ResolvedEntitlements["entitlements"]
) {
  const value = resolved.entitlements[key];
  return typeof value === "number" || value === null ? value : 0;
}

function usage(current: number, limit: number | null) {
  return {
    current,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - current),
  };
}

export async function getBillingUsage(
  account: BillingAccount,
  resolved: ResolvedEntitlements
) {
  const periodKey = `${new Date().getUTCFullYear()}-${String(
    new Date().getUTCMonth() + 1
  ).padStart(2, "0")}`;
  const premiumMessages = await db.premiumMessageUsage.aggregate({
    where: { billingAccountId: account.id, periodKey },
    _sum: { count: true },
  });

  if (account.type === "FAMILY" && account.parentId) {
    const [children, drivers, viewers, pendingViewerInvites, recurringTrips] = await Promise.all([
      db.parentChild.count({ where: { parentId: account.parentId } }),
      db.parentDriverConnection.count({
        where: {
          parentId: account.parentId,
          status: { notIn: ["DECLINED", "REVOKED"] },
        },
      }),
      db.tripViewer.count({
        where: {
          trip: { createdBy: account.parentId },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      db.tripViewerInvite.count({
        where: {
          billingAccountId: account.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      }),
      db.tripTemplate.count({
        where: { billingAccountId: account.id, isActive: true },
      }),
    ]);
    return {
      children: usage(children, limitValue(resolved, "max_children")),
      connectedDrivers: usage(drivers, limitValue(resolved, "max_connected_drivers")),
      viewers: usage(viewers + pendingViewerInvites, limitValue(resolved, "max_viewers")),
      recurringTrips: usage(recurringTrips, limitValue(resolved, "max_recurring_trip_templates")),
      premiumMessages: usage(
        premiumMessages._sum.count ?? 0,
        limitValue(resolved, "premium_messages_per_month")
      ),
    };
  }

  if (account.type === "SCHOOL" && account.userId) {
    const [buses, students, teachers, drivers] = await Promise.all([
      db.buses.count({ where: { schoolId: account.userId } }),
      db.student.count({ where: { schoolId: account.userId } }),
      db.teacher.count({ where: { schoolId: account.userId } }),
      db.driver.count({ where: { schoolId: account.userId } }),
    ]);
    return {
      buses: usage(buses, limitValue(resolved, "max_buses")),
      students: usage(students, limitValue(resolved, "max_students")),
      staff: usage(teachers + drivers, limitValue(resolved, "max_staff")),
      premiumMessages: usage(
        premiumMessages._sum.count ?? 0,
        limitValue(resolved, "premium_messages_per_month")
      ),
    };
  }

  return {
    premiumMessages: usage(
      premiumMessages._sum.count ?? 0,
      limitValue(resolved, "premium_messages_per_month")
    ),
  };
}
