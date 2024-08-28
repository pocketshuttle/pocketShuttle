"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { StudentAttendance } from "@prisma/client";

type ParamsProps = {
  id: string;
};

export const updateStudentAttendance = async (
  id: string,
  data: StudentAttendance
) => {
  try {
    if (!data) {
      return { message: "Invalid data provided", status: 400 };
    }

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: {
        attendance: data,
      },
    });

    if (!updatedStudent) {
      return { message: "Student not found", status: 404 };
    }

    revalidatePath("/teacher");
    revalidateTag("students");

    return {
      message: "Attendance updated successfully",
      student: updatedStudent,
      status: 200,
    };
  } catch (error) {
    console.error("Error updating attendance:", error);

    return {
      message: "Error updating attendance",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
};
