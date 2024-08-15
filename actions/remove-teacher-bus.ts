"use server";

import { db } from "@/lib/db";

export const removeTeacherFromBus = async (
  teacherId: string,
  busId: string
) => {
  try {
    if (!teacherId || !busId) {
      return {
        message: "Both studentId and busId are required",
      };
    }
    //found teacher
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        bus: true,
      },
    });

    //found bus
    const bus = await db.buses.findUnique({
      where: { id: busId },
    });

    if (!teacher || !bus) {
      return { message: "Teacher or Bus not found" };
    }

    // Remove the bus reference from the teacher document
    await db.buses.update({
      where: { id: busId },
      data: {
        teacher: {
          disconnect: { id: teacherId },
        },
      },
    });

    await db.teacher.update({
      where: { id: teacherId },
      data: { busId: undefined },
    });

    return { message: "Teacher removed from bus" };
  } catch (error) {
    console.error("Error updating Bus:", error);
    return { message: "Error updating Bus" };
  }
};
