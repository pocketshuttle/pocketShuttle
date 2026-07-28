import { NextResponse } from "next/server";

import { canManageSchool, getApiSession } from "@/lib/api-auth";
import {
  getEntitlements,
  historyCutoff,
  requireFeature,
} from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

export async function GET() {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "analytics");
    const cutoff = historyCutoff(resolved);
    const tripWhere = {
      schoolId,
      ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
    };
    const [trips, activeTrips, completedTrips, safetyEvents, pickups, students, buses] =
      await Promise.all([
        db.trip.count({ where: tripWhere }),
        db.trip.count({ where: { ...tripWhere, status: "active" } }),
        db.trip.count({ where: { ...tripWhere, status: "completed" } }),
        db.tripEvent.count({
          where: {
            trip: { schoolId },
            eventType: { in: ["emergency_triggered", "route_deviation", "unusual_stop"] },
            ...(cutoff ? { timestamp: { gte: cutoff } } : {}),
          },
        }),
        db.pickup.count({
          where: {
            Student: { schoolId },
            ...(cutoff ? { pickUpTime: { gte: cutoff } } : {}),
          },
        }),
        db.student.count({ where: { schoolId } }),
        db.buses.count({ where: { schoolId } }),
      ]);
    return NextResponse.json({
      windowStartsAt: cutoff,
      totals: { trips, activeTrips, completedTrips, safetyEvents, pickups, students, buses },
      completionRate: trips ? Math.round((completedTrips / trips) * 100) : 0,
    });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json({ message: "Unable to load analytics" }, { status: 400 });
  }
}
