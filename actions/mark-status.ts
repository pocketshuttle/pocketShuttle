"use server";

import db, { StudentStatus } from "@/packages/db/client";
import { Knock } from "@knocklabs/node";
import { revalidateTag } from "next/cache";
import { logMorningPickup } from "./report-folder/log-morning-pickup";
import z from "zod";
import { getUserSession } from "@/lib/session";

type ParamsProps = {
  id: string;
};

const knock = new Knock(process.env.KNOCK_SECRET_API_SECRET);

function getCurrentHourInTimeZone(timezone: string): number {
  const date = new Date();
  const tz = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return tz.getHours();
}

const StudentStatusSchema = z.enum([
  "PICKED",
  "DROPPED",
  "IN_BUS",
  "AT_SCHOOL",
  "NONE",
  "ABSENT",
]);

async function handleBusSeatUpdate(
  status: StudentStatus | null,
  busId: string
) {
  const bus = await db.buses.findUnique({
    where: { id: busId },
    select: { seat_number: true },
  });

  if (!bus) {
    console.warn(`Bus with ID ${busId} not found.`);
    return;
  }
  //we decrease the bus by one when a child is picked up.
  if (status === "PICKED") {
    await db.buses.update({
      where: { id: busId },
      data: { seat_number: { decrement: 1 } },
    });
  } else if (status === "DROPPED") {
    //and vice versa
    await db.buses.update({
      where: { id: busId },
      data: { seat_number: { increment: 1 } },
    });
  }
}

//this is an important update, when a child is picked in the morning or picked in the afternoon
//which means we've to update our timelines in the afternoon and night
async function handlePresenceUpdate(
  id: string,
  updatedStudent: any,
  hours: number
) {
  if (updatedStudent.status === "PICKED" && hours >= 4 && hours < 9) {
    await db.student.update({
      where: { id: id },
      data: { presence: "IN_BUS" },
    });
  } else if (updatedStudent.status === "PICKED" && hours >= 9 && hours < 15) {
    await db.student.update({
      where: { id: id },
      data: { presence: "AT_SCHOOL" },
    });
  } else if (updatedStudent.status === "DROPPED" && hours >= 16 && hours < 19) {
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
  const user = await getUserSession();
  if (!user || !["teacher", "admin"].includes(user?.role)) {
    return { message: "Unauthorized", status: 401 };
  }
  revalidateTag("teacher");

  try {
    if (!data) {
      return { message: "No data provided", status: 400 };
    }

    const parsedStatus = StudentStatusSchema.safeParse(data);
    if (!parsedStatus.success) {
      return { status: 400, message: "Invalid status" };
    }

    const existingStudent = await db.student.findUnique({
      where: { id: id },
      select: { status: true, busId: true },
    });

    if (!existingStudent) {
      return { message: "Student not found", status: 404 };
    }

    if (existingStudent.status === data) {
      return {
        message: `Status is already ${data}`,
        student: existingStudent,
        status: 200,
      };
    }

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: { status: data },
      include: {
        parent: true,
        bus: {
          select: {
            teacher: {
              select: {
                id: true,
              },
            },
          },
        },
      },
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
    if (updatedStudent.status === "PICKED" && hours >= 4 && hours < 16) {
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
