import {
  StudentAttendance,
  StudentPresence,
  StudentStatus,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { runDeduplicatedMobileEvent } from "@/lib/mobile/deduplication";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";
import {
  applyStudentAttendanceUpdate,
  applyStudentPresenceUpdate,
  applyStudentStatusUpdate,
  getStudentScopeForActor,
} from "@/lib/student-state";

const attendanceValues = new Set(Object.values(StudentAttendance));
const statusValues = new Set(Object.values(StudentStatus));
const presenceValues = new Set(Object.values(StudentPresence));

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireMobileActor(request);
    if (actor.role !== "teacher") {
      throw new MobileApiError(
        "FORBIDDEN",
        403,
        "Teacher access is required."
      );
    }
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const field = String(body.field || "").toLowerCase();
    const value = String(body.value || "").toUpperCase();
    const scope = getStudentScopeForActor(id, actor);
    const update = async () => {
      const result =
        field === "attendance" &&
        attendanceValues.has(value as StudentAttendance)
          ? await applyStudentAttendanceUpdate(
              scope,
              value as StudentAttendance
            )
          : field === "status" && statusValues.has(value as StudentStatus)
            ? await applyStudentStatusUpdate(scope, value as StudentStatus)
            : field === "presence" &&
                presenceValues.has(value as StudentPresence)
              ? await applyStudentPresenceUpdate(
                  scope,
                  value as StudentPresence
                )
              : null;
      if (!result) {
        throw new MobileApiError(
          field ? "NOT_FOUND" : "INVALID_REQUEST",
          field ? 404 : 400,
          field ? "Student not found." : "Invalid student state update."
        );
      }
      if (result.blockedReason) {
        throw new MobileApiError(
          "CONFLICT",
          409,
          "The student must be present before starting a trip."
        );
      }
      return {
        changed: result.changed,
        student: {
          id: result.student.id,
          name: result.student.full_name,
          attendance: result.student.attendance,
          status: result.student.status,
          presence: result.student.presence,
        },
      };
    };
    const result = await runDeduplicatedMobileEvent({
      actor,
      clientEventId: body.clientEventId,
      eventType: `student_state:${field}`,
      action: update,
    });
    return NextResponse.json({
      ...result.value,
      duplicate: result.duplicate,
    });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
