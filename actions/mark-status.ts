"use server";

import { db } from "@/lib/db";
import { sendMagicBellNotification } from "@/magicbell/notification";

type ParamsProps = {
  id: string;
};

function getCurrentHourInTimeZone(timezone: string): number {
  const date = new Date();
  const tz = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return tz.getHours();
}

export const updateStudentStatus = async (
  id: string,
  data: { attendance: string }
) => {
  console.log(data, "status data");
  try {
    if (!data) {
      return { message: "No data provided", status: 400 };
    }

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: {
        status: data.attendance,
      },
    });

    console.log(updatedStudent);

    if (updatedStudent.status === "PICKED" && updatedStudent.busId) {
      await db.buses.update({
        where: { id: updatedStudent.busId },
        data: {
          seat_number: {
            decrement: 1,
          },
        },
      });
    } else if (updatedStudent.status === "DROPPED" && updatedStudent.busId) {
      await db.buses.update({
        where: { id: updatedStudent.busId },
        data: {
          seat_number: {
            increment: 1,
          },
        },
      });
    }

    const hours = getCurrentHourInTimeZone("Africa/Lagos");

    if (updatedStudent.status === "PICKED" && hours >= 6 && hours < 9) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "IN_BUS",
        },
      });
      // await sendMagicBellNotification(
      //   updatedStudent.parentEmail,
      //   "Child Status Update",
      //   "Your child is now in the bus."
      // );
    } else if (updatedStudent.status === "PICKED" && hours >= 9 && hours < 16) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "AT_SCHOOL",
        },
      });
    } else if (
      updatedStudent.status === "DROPPED" &&
      hours >= 17 &&
      hours < 19
    ) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "NONE",
        },
      });
    } else if (updatedStudent.status === "DROPPED" && hours > 19) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "NONE",
          status: "DROPPED",
          attendance: "ABSENT",
        },
      });
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
