import {
  StudentAttendance,
  StudentPresence,
  StudentStatus,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("operations.manage");
    const { id } = await params;
    const body = await request.json();
    const reason = String(body.reason || "").trim();
    if (reason.length < 5) {
      return NextResponse.json(
        { message: "A correction reason is required" },
        { status: 400 }
      );
    }
    const before = await db.student.findUnique({
      where: { id },
      select: { id: true, attendance: true, status: true, presence: true, schoolId: true },
    });
    if (!before) return NextResponse.json({ message: "Student not found" }, { status: 404 });
    const attendance =
      body.attendance && Object.values(StudentAttendance).includes(body.attendance)
        ? body.attendance
        : undefined;
    const status =
      body.status && Object.values(StudentStatus).includes(body.status)
        ? body.status
        : undefined;
    const presence =
      body.presence && Object.values(StudentPresence).includes(body.presence)
        ? body.presence
        : undefined;
    if (!attendance && !status && !presence) {
      return NextResponse.json({ message: "No valid correction supplied" }, { status: 400 });
    }
    const student = await db.student.update({
      where: { id },
      data: { attendance, status, presence },
      select: { id: true, attendance: true, status: true, presence: true },
    });
    await logSuperUserAction({
      superUserId: session.id,
      action: "ATTENDANCE_CORRECTED",
      targetId: `student:${id}`,
      metadata: { reason, before, after: student },
    });
    return NextResponse.json({ message: "Attendance corrected", student });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to correct attendance";
    return NextResponse.json(
      { message },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "FORBIDDEN" || message === "INVALID_ORIGIN"
              ? 403
              : 400,
      }
    );
  }
}
