import { NextResponse } from "next/server";

import { canManageSchool, getApiSession } from "@/lib/api-auth";
import { ensureSchoolBillingAccount } from "@/lib/billing/accounts";
import { getEntitlements, hasFeature, historyCutoff } from "@/lib/billing/entitlements";
import { getBillingUsage } from "@/lib/billing/usage";
import db from "@/packages/db/client";

export async function GET() {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [account, resolved] = await Promise.all([
    ensureSchoolBillingAccount(schoolId),
    getEntitlements(session),
  ]);
  const cutoff = historyCutoff(resolved);
  const tripWhere = { schoolId, ...(cutoff ? { createdAt: { gte: cutoff } } : {}) };
  const [
    usage,
    trips,
    safetyEvents,
    attendanceEvents,
    buses,
    drivers,
    teachers,
    memberships,
    policies,
    importJobs,
    deliveries,
  ] = await Promise.all([
    getBillingUsage(account, resolved),
    db.trip.findMany({
      where: tripWhere,
      select: { status: true, startedAt: true, endedAt: true, createdAt: true },
    }),
    db.tripEvent.count({
      where: {
        trip: { schoolId },
        eventType: { in: ["emergency_triggered", "route_deviation", "unusual_stop"] },
        ...(cutoff ? { timestamp: { gte: cutoff } } : {}),
      },
    }),
    db.tripEvent.groupBy({
      by: ["eventType"],
      where: {
        trip: { schoolId },
        eventType: { in: ["participant_present", "participant_absent", "participant_boarded", "participant_dropped"] },
        ...(cutoff ? { timestamp: { gte: cutoff } } : {}),
      },
      _count: { _all: true },
    }),
    db.buses.findMany({
      where: { schoolId },
      select: {
        id: true,
        bus_number: true,
        bus_product_name: true,
        seat_number: true,
        availableSeats: true,
        _count: { select: { students: true } },
        route: { select: { route_name: true } },
        driver: { select: { id: true, full_name: true } },
        teacher: { select: { id: true, full_name: true } },
      },
      orderBy: { bus_number: "asc" },
    }),
    db.driver.findMany({
      where: { schoolId },
      select: {
        id: true,
        full_name: true,
        email: true,
        verificationStatus: true,
        verificationRejectionReason: true,
      },
      orderBy: { full_name: "asc" },
    }),
    db.teacher.findMany({
      where: { schoolId },
      select: { id: true, full_name: true, email: true },
      orderBy: { full_name: "asc" },
    }),
    db.schoolMembership.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" } }),
    db.schoolNotificationPolicy.findMany({ where: { schoolId }, orderBy: { eventType: "asc" } }),
    db.schoolImportJob.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.notificationDelivery.findMany({
      where: { billingAccountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const completed = trips.filter((trip) => trip.status === "completed");
  const durations = completed.flatMap((trip) =>
    trip.startedAt && trip.endedAt
      ? [(trip.endedAt.getTime() - trip.startedAt.getTime()) / 60000]
      : []
  );
  const totalSeats = buses.reduce((sum, bus) => sum + bus.seat_number, 0);
  const assignedStudents = buses.reduce((sum, bus) => sum + bus._count.students, 0);
  return NextResponse.json({
    plan: {
      code: resolved.planCode,
      name: resolved.planName,
      status: resolved.status,
      entitlements: resolved.entitlements,
      historyCutoff: cutoff,
    },
    usage,
    analytics: hasFeature(resolved, "analytics") ? {
      trips: trips.length,
      activeTrips: trips.filter((trip) => ["active", "paused", "emergency"].includes(trip.status)).length,
      completionRate: trips.length ? Math.round((completed.length / trips.length) * 100) : 0,
      averageTripMinutes: durations.length
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : 0,
      safetyEvents,
      capacityUtilization: totalSeats ? Math.round((assignedStudents / totalSeats) * 100) : 0,
      attendanceEvents: Object.fromEntries(
        attendanceEvents.map((item) => [item.eventType, item._count._all])
      ),
      notificationAccepted: deliveries.filter((item) => ["ACCEPTED", "DELIVERED"].includes(item.status)).length,
      notificationFailed: deliveries.filter((item) => item.status === "FAILED").length,
    } : null,
    buses,
    drivers,
    teachers,
    memberships,
    policies,
    importJobs,
    deliveries,
  });
}
