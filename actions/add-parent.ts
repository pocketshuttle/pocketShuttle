"use server";
import { db } from "@/lib/db";

export const addParent = async (studentId: string, userId: string) => {
  try {
    // const student = await db.student.findUnique({
    //   where: {
    //     id: studentId,
    //   },
    // });
    const parent = await db.parent.update({
      where: { id: userId },
      data: {
        Student: {
          connect: { id: studentId },
        },
      },
    });

    // console.log("busID", busId);
    if (!parent) {
      return { message: "Student could be not found" };
    }

    await db.student.update({
      where: {
        id: userId,
      },
      data: {
        parent: {
          connect: { id: parent.id },
        },
      },
    });

    return { message: "Student added to parent" };
  } catch (error) {
    console.error("Error adding Parent:", error);
    return { message: "Error adding Parent" };
  }
};
