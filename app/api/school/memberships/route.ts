import { NextRequest, NextResponse } from "next/server";

import { canManageSchool, getApiSession } from "@/lib/api-auth";
import { getEntitlements, requireFeature } from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

const ROLE_PERMISSIONS = {
  ADMINISTRATOR: ["school.manage", "staff.manage", "trips.manage", "reports.view", "billing.view"],
  DISPATCHER: ["trips.manage", "fleet.view", "attendance.manage", "reports.view"],
  TEACHER: ["attendance.manage", "students.view", "trip.update"],
  DRIVER: ["assigned_trip.view", "trip.location", "trip.event"],
} as const;

export async function GET() {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const memberships = await db.schoolMembership.findMany({
    where: { schoolId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ memberships, roles: ROLE_PERMISSIONS });
}

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "staff_permissions");
    const body = await req.json().catch(() => ({}));
    const role = String(body.role || "").toUpperCase() as keyof typeof ROLE_PERMISSIONS;
    const actorId = String(body.actorId || "");
    const actorType = String(body.actorType || "").toLowerCase();
    if (!actorId || !ROLE_PERMISSIONS[role] || !["teacher", "driver", "admin"].includes(actorType)) {
      return NextResponse.json({ message: "Invalid membership" }, { status: 400 });
    }
    const actorExists =
      actorType === "teacher"
        ? await db.teacher.findFirst({ where: { id: actorId, schoolId }, select: { id: true } })
        : actorType === "driver"
          ? await db.driver.findFirst({ where: { id: actorId, schoolId }, select: { id: true } })
          : actorId === schoolId
            ? { id: actorId }
            : null;
    if (!actorExists) return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    const membership = await db.schoolMembership.upsert({
      where: { schoolId_actorType_actorId: { schoolId, actorType, actorId } },
      create: {
        schoolId,
        actorId,
        actorType,
        role,
        permissions: [...ROLE_PERMISSIONS[role]],
      },
      update: {
        role,
        permissions: [...ROLE_PERMISSIONS[role]],
      },
    });
    return NextResponse.json({ message: "Staff role saved", membership });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json({ message: "Unable to save staff role" }, { status: 400 });
  }
}
