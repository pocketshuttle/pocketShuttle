"use server";
import { StudentPresence } from "@/packages/db/client";
import { getUserSession } from "@/lib/session";
import {
  applyStudentPresenceUpdate,
  getStudentScopeForActor,
} from "@/lib/student-state";
import { recordStudentMovementTripEvent } from "@/lib/trip-events";

export const updateLocation = async (
  id: string,
  data: StudentPresence,
  eta?: string
) => {
  try {
    const user = await getUserSession();
    const role = String(user?.role ?? "").toLowerCase();
    if (!user || !["teacher", "admin", "school"].includes(role)) {
      return { message: "Unauthorized", status: 401 };
    }
    if (!data) {
      return { message: "Invalid presence value", status: 400 };
    }

    const result = await applyStudentPresenceUpdate(
      getStudentScopeForActor(id, user),
      data
    );
    if (!result) {
      return { message: "Student not found", status: 404 };
    }
    const updatedStudent = result.student;

    if (result.blockedReason === "NOT_PRESENT") {
      return {
        message: "Mark the student present before sending OTW",
        student: updatedStudent,
        status: 400,
      };
    }

    if (result.changed) {
      await recordStudentMovementTripEvent({
        student: updatedStudent,
        actorId: String(user.id),
        actorType: role,
        source: "presence",
        value: data,
        eta,
      });
    }

    return {
      message: result.changed
        ? "Presence updated successfully"
        : `Presence is already ${updatedStudent.presence}`,
      student: updatedStudent,
      status: 200,
    };
  } catch (error) {
    console.error("Error updating presence:", error);
    return {
      message: "Error updating presence",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
};
