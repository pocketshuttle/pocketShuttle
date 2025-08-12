"use server";

import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

export const addTeacher = async (id: string, busId: string) => {
  try {
    const teacher = await db.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        bus: true,
      },
    });

    if (!teacher) {
      return { message: "Teacher not found" };
    }

    await db.buses.update({
      where: { id: busId },
      data: {
        teacher: {
          connect: { id: id },
        },
      },
    });

    await db.teacher.update({
      where: { id },
      data: { busId },
    });

    revalidateTag("teacher");

    return {
      message: `${teacher?.full_name} added to bus successfully`,
    };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { message: "Error updating attendance" };
  }
};
