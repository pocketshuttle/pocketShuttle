"use server";

import { StudentStatus } from "@/packages/db/client";
import { logMorningPickup } from "./report-folder/log-morning-pickup";
import z from "zod";
import { getUserSession } from "@/lib/session";
import {
  applyStudentStatusUpdate,
  getCurrentHourInTimeZone,
  getStudentScopeForActor,
} from "@/lib/student-state";
import { recordStudentMovementTripEvent } from "@/lib/trip-events";

const StudentStatusSchema = z.enum(["PICKED", "DROPPED"]);

export const updateStudentStatus = async (id: string, data: StudentStatus) => {
  const user = await getUserSession();
  const role = String(user?.role ?? "").toLowerCase();
  if (!user || !["teacher", "admin", "school"].includes(role)) {
    return { message: "Unauthorized", status: 401 };
  }

  try {
    if (!data) {
      return { message: "No data provided", status: 400 };
    }

    const parsedStatus = StudentStatusSchema.safeParse(data);
    if (!parsedStatus.success) {
      return { status: 400, message: "Invalid status" };
    }

    const hours = getCurrentHourInTimeZone("Africa/Lagos");
    const result = await applyStudentStatusUpdate(
      getStudentScopeForActor(id, user),
      data,
      hours
    );
    if (!result) {
      return { message: "Student not found", status: 404 };
    }

    const updatedStudent = result.student;

    if (!result.changed) {
      return {
        message: `Status is already ${data}`,
        student: updatedStudent,
        status: 200,
      };
    }

    await recordStudentMovementTripEvent({
      student: updatedStudent,
      actorId: String(user.id),
      actorType: role,
      source: "status",
      value: data,
    });

    await logMorningPickup(updatedStudent, hours);

    return {
      message: "Status updated successfully",
      student: updatedStudent,
      status: 200,
    };
  } catch (error) {
    console.error("Error updating status:", error);

    return {
      message: "Error updating status",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
};
