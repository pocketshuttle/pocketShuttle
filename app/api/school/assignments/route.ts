import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { canManageSchool, getApiSession } from "@/lib/api-auth";
import { getEntitlements, requireFeature } from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    requireFeature(await getEntitlements(session), "assignments");
    const body = await req.json().catch(() => ({}));
    const busId = String(body.busId || "");
    const driverId = body.driverId ? String(body.driverId) : null;
    const teacherId = body.teacherId ? String(body.teacherId) : null;
    const [bus, driver, teacher] = await Promise.all([
      db.buses.findFirst({ where: { id: busId, schoolId }, select: { id: true } }),
      driverId
        ? db.driver.findFirst({ where: { id: driverId, schoolId }, select: { id: true } })
        : null,
      teacherId
        ? db.teacher.findFirst({ where: { id: teacherId, schoolId }, select: { id: true } })
        : null,
    ]);
    if (!bus || (driverId && !driver) || (teacherId && !teacher)) {
      return NextResponse.json({ message: "Invalid school assignment" }, { status: 400 });
    }
    const updated = await db.buses.update({
      where: { id: bus.id },
      data: {
        driver: driver ? { connect: { id: driver.id } } : { disconnect: true },
        teacher: teacher ? { connect: { id: teacher.id } } : { disconnect: true },
      },
      include: {
        driver: { select: { id: true, full_name: true } },
        teacher: { select: { id: true, full_name: true } },
      },
    });
    await db.auditLog.create({
      data: {
        userId: schoolId,
        action: "SCHOOL_BUS_ASSIGNMENT_UPDATED",
        details: { actorId: session.id, busId, driverId, teacherId },
      },
    });
    return NextResponse.json({ message: "Assignment updated", bus: updated });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json({ message: "Unable to update assignment" }, { status: 400 });
  }
}
