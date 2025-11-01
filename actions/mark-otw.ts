"use server";
// import { StudentPresence } from "@prisma/client";
import db, { StudentPresence } from "@/packages/db/client";
import { revalidateTag } from "next/cache";
import { sendSms } from "./notification/send-sms";
import { sendSmsForBusArrival } from "./notification/bus-arrival";
import { sendPushNotification } from "@/onesignal/send-push";
import { getUserSession } from "@/lib/session";

const capitalizeParentName = (str: string | null) => {
  str
    ? str
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "Parent";
};

export const updateLocation = async (
  id: string,
  data: StudentPresence,
  eta?: string
) => {
  try {
    const user = await getUserSession();
    if (!user || !["teacher", "admin", "ADMIN"].includes(user.role as string)) {
      return { message: "Unauthorized", status: 401 };
    }
    if (!data) {
      return { message: "Invalid presence value", status: 400 };
    }

    const updatedStudent = await db.student.update({
      where: { id },
      data: { presence: data },
      select: {
        id: true,
        presence: true,
        full_name: true,
        parent: {
          select: { phoneNumber: true, full_name: true, id: true },
        },
        bus: {
          select: { id: true, bus_product_name: true },
        },
      },
    });

    if (!updatedStudent) {
      return { message: "Student not found", status: 404 };
    }

    try {
      if (data === "ON_THE_WAY") {
        await sendSmsForBusArrival({
          student_name: updatedStudent.full_name ?? "",
          parent_name: updatedStudent?.parent?.full_name ?? "",
          bus_name: updatedStudent?.bus?.bus_product_name ?? "",
          phoneNumber: updatedStudent?.parent?.phoneNumber ?? "",
          eta: eta ?? "unknown",
        });

        await sendPushNotification(
          `Hi ${capitalizeParentName(updatedStudent?.parent?.full_name || "")}, ${updatedStudent?.bus?.bus_product_name} is on the way`,
          updatedStudent?.parent?.id!
        );
      }
    } catch (notifyErr) {
      console.error("Notification failed:", notifyErr);
    }

    revalidateTag("students");

    return {
      message: "Presence updated successfully",
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
