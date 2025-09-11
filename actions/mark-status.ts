"use server";

import { db } from "@/lib/db";
import { Knock } from "@knocklabs/node";
import { StudentStatus } from "@prisma/client";
import { revalidateTag } from "next/cache";

type ParamsProps = {
  id: string;
};

const knock = new Knock(process.env.KNOCK_SECRET_API_SECRET);

function getCurrentHourInTimeZone(timezone: string): number {
  const date = new Date();
  const tz = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return tz.getHours();
}

async function handleBusSeatUpdate(
  status: StudentStatus | null,
  busId: string
) {
  if (status === "PICKED") {
    await db.buses.update({
      where: { id: busId },
      data: { seat_number: { decrement: 1 } },
    });
  } else if (status === "DROPPED") {
    await db.buses.update({
      where: { id: busId },
      data: { seat_number: { increment: 1 } },
    });
  }
}

async function handlePresenceUpdate(
  id: string,
  updatedStudent: any,
  hours: number
) {
  if (updatedStudent.status === "PICKED" && hours >= 6 && hours < 9) {
    await db.student.update({
      where: { id: id },
      data: { presence: "IN_BUS" },
    });
  } else if (updatedStudent.status === "PICKED" && hours >= 9 && hours < 16) {
    await db.student.update({
      where: { id: id },
      data: { presence: "AT_SCHOOL" },
    });
  } else if (updatedStudent.status === "DROPPED" && hours >= 17 && hours < 19) {
    await db.student.update({
      where: { id: id },
      data: { presence: "NONE" },
    });
  } else if (updatedStudent.status === "DROPPED" && hours > 19) {
    await db.student.update({
      where: { id: id },
      data: { presence: "NONE", status: "DROPPED", attendance: "ABSENT" },
    });
  }
}

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
  try {
    if (!data) {
      return { message: "No data provided", status: 400 };
    }

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: { status: data },
      include: { parent: true, Buses: true, bus: true },
    });

    // Revalidate parent and student data
    revalidateTag("parent");
    revalidateTag("students");

    // Handle seat updates for buses
    if (updatedStudent.busId) {
      await handleBusSeatUpdate(updatedStudent.status, updatedStudent.busId);
    }

    const hours = getCurrentHourInTimeZone("Africa/Lagos");

    await logMorningPickup(updatedStudent, hours);

    // Update student presence based on status and time
    await handlePresenceUpdate(id, updatedStudent, hours);

    // Send notification if student status is PICKED
    if (updatedStudent.status === "PICKED" && hours >= 6 && hours < 16) {
      await sendKnockNotification(updatedStudent);
    }

    // Revalidate again to ensure cache freshness
    revalidateTag("students");
    revalidateTag("parent");

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
