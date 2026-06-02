"use server";

import db, { StudentStatus } from "@/packages/db/client";
import { Knock } from "@knocklabs/node";
import { logMorningPickup } from "./report-folder/log-morning-pickup";
import z from "zod";
import { getUserSession } from "@/lib/session";
import {
  applyStudentStatusUpdate,
  getCurrentHourInTimeZone,
} from "@/lib/student-state";

const knock = new Knock(process.env.KNOCK_SECRET_API_SECRET);
const StudentStatusSchema = z.enum(["PICKED", "DROPPED"]);

async function sendKnockNotification(updatedStudent: any) {
  if (updatedStudent?.parent?.id && updatedStudent?.bus?.bus_product_name) {
    await knock.workflows.trigger("in-bus", {
      data: { bus_product_name: updatedStudent.bus.bus_product_name },
      recipients: [
        {
          id: updatedStudent.parent.id,
          name: updatedStudent.parent.full_name,
          email: updatedStudent.parent.email,
        },
      ],
    });
  }
}

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
    const result = await applyStudentStatusUpdate({ studentId: id }, data, hours);
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

    await logMorningPickup(updatedStudent, hours);

    // Send notification if student status is PICKED
    if (updatedStudent.status === "PICKED" && hours >= 4 && hours < 16) {
      await sendKnockNotification(updatedStudent);
    }

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
