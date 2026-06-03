"use server";
// import { StudentPresence } from "@prisma/client";
import { StudentPresence } from "@/packages/db/client";
import { sendSmsForBusArrival } from "./notification/bus-arrival";
import { sendPushNotification } from "@/onesignal/send-push";
import { getUserSession } from "@/lib/session";
import { applyStudentPresenceUpdate } from "@/lib/student-state";
import { capitalizeName } from "@/lib/capitalize-name";

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

    const result = await applyStudentPresenceUpdate({ studentId: id }, data);
    if (!result) {
      return { message: "Student not found", status: 404 };
    }
    const updatedStudent = result.student;

    try {
      if (data === "ON_THE_WAY" && result.changed) {
        await sendSmsForBusArrival({
          student_name: updatedStudent.full_name ?? "",
          parent_name: updatedStudent?.parent?.full_name ?? "",
          bus_name: updatedStudent?.bus?.bus_product_name ?? "",
          phoneNumber: updatedStudent?.parent?.phoneNumber ?? "",
          eta: eta ?? "unknown",
        });

        await sendPushNotification(
          `Hi ${capitalizeName(updatedStudent?.parent?.full_name || "Parent")}, ${updatedStudent?.bus?.bus_product_name} is on the way`,
          updatedStudent?.parent?.id!
        );
      }
    } catch (notifyErr) {
      console.error("Notification failed:", notifyErr);
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
