import { NextResponse } from "next/server";

import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformPermission("reports.read");
    const [
      usersByRole,
      parentsByAccountType,
      driversByVerification,
      requestsByStatus,
      paymentsByStatus,
      plans,
      recentSchools,
      recentParents,
      recentDrivers,
    ] = await Promise.all([
      db.user.groupBy({ by: ["role"], _count: { _all: true } }),
      db.parent.groupBy({ by: ["accountType"], _count: { _all: true } }),
      db.driver.groupBy({ by: ["verificationStatus"], _count: { _all: true } }),
      db.driverRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      db.payment.groupBy({ by: ["status"], _sum: { amount: true }, _count: { _all: true } }),
      db.plan.findMany({ include: { _count: { select: { subscriptions: true } } }, orderBy: { price: "asc" } }),
      db.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { id: "desc" }, take: 5 }),
      db.parent.findMany({ select: { id: true, full_name: true, email: true, accountType: true }, orderBy: { createdAt: "desc" }, take: 5 }),
      db.driver.findMany({ select: { id: true, full_name: true, email: true, accountType: true, verificationStatus: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    return NextResponse.json({
      usersByRole,
      parentsByAccountType,
      driversByVerification,
      requestsByStatus,
      paymentsByStatus,
      plans,
      recentSignups: { schools: recentSchools, parents: recentParents, drivers: recentDrivers },
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
