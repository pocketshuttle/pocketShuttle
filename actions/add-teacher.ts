"use server";

import { revalidate } from "@/app/api/addstudent/[id]/route";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const addTeacher = async (id: string, busId: string) => {
  try {
    const teacher = await db.teacher.findUnique({
      where: {
        id,
      },
      include: {
        bus: true,
      },
    });

    // console.log("busID", busId);
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

    revalidatePath("/teacher");

    return { message: "Teacher added to bus" };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { message: "Error updating attendance" };
  }
};
