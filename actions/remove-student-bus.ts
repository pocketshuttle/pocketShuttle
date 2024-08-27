"use server";

import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

export const removeStudentFromBus = async (
  studentId: string,
  busId: string | undefined
) => {
  try {
    if (!studentId || !busId) {
      return {
        message: "Both studentId and busId are required",
      };
    }
    //found
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        bus: true,
      },
    });

    //found bus
    const bus = await db.buses.findUnique({
      where: { id: busId },
    });

    if (!student || !bus) {
      return { message: "student or Bus not found" };
    }

    // Remove the bus reference from the student document
    await db.buses.update({
      where: { id: busId },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });

    await db.student.update({
      where: { id: studentId },
      data: { busId: undefined },
    });

    revalidateTag("students");

    return { message: "student removed from bus" };
  } catch (error) {
    console.error("Error updating Bus:", error);
    return { message: "Error updating Bus" };
  }
};
