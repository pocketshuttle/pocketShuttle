"use server";

import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";
import { revalidateTag } from "next/cache";

export const removeTeacherFromBus = async (
  teacherId: string,
  busId: string
) => {
  try {
    const user = await getUserSession();
    if (!user || !["teacher", "admin", "ADMIN"].includes(user.role as string)) {
      return { message: "Unauthorized", status: 401 };
    }
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

    revalidateTag("remove-bus");

    return { message: "Teacher removed from bus" };
  } catch (error) {
    console.error("Error updating Bus:", error);
    return { message: "Error updating Bus" };
  }
};
