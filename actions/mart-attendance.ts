"use server";

import { StudentAttendance } from "@/packages/db/client";
import { broadcastAttendanceUpdate } from "@/app/api/events/attendance-events";
import { getUserSession } from "@/lib/session";
import {
  applyStudentAttendanceUpdate,
  getStudentScopeForActor,
} from "@/lib/student-state";
import { recordStudentMovementTripEvent } from "@/lib/trip-events";

export const updateStudentAttendance = async (
  id: string,
  data: StudentAttendance
) => {
  const user = await getUserSession();
  const role = String(user?.role ?? "").toLowerCase();
  if (!user || !["teacher", "admin", "school"].includes(role)) {
    return { message: "Unauthorized", status: 401 };
  }

  try {
    if (!data) {
      return { message: "Invalid data provided", status: 400 };
    }

    const result = await applyStudentAttendanceUpdate(
      getStudentScopeForActor(id, user),
      data
    );
    if (!result) {
      return { message: "Student not found", status: 404 };
    }
    const updatedStudent = result.student;

    if (result.changed) {
      await recordStudentMovementTripEvent({
        student: updatedStudent,
        actorId: String(user.id),
        actorType: role,
        source: "attendance",
        value: data,
      });

      broadcastAttendanceUpdate({
        id: updatedStudent.id,
        fullName: updatedStudent.full_name,
        attendance: updatedStudent.attendance,
        bus: updatedStudent.bus?.bus_product_name || "bus",
      });
    }

    return {
      message: result.changed
        ? "Attendance updated successfully"
        : `Attendance is already ${updatedStudent.attendance}`,
      student: updatedStudent,
      status: 200,
    };
  } catch (error) {
    console.error("Error updating attendance:", error);

    return {
      message: "Error updating attendance",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
};
