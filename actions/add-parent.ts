"use server";
import db from "@/packages/db/client";
import { revalidateTag } from "next/cache";

export const addParent = async (
  studentId: string,
  parentId: string,
  confirmation?: string
) => {
  try {
    const available = await db.student.findUnique({
      where: { id: studentId },
    });

    if (available?.parentId !== null) {
      return { message: "Student already belong to a parent", status: 100 };
    }

    const parent = await db.parent.update({
      where: { id: parentId },
      data: {
        Student: {
          connect: { id: studentId },
        },
      },
    });

    if (!parent) {
      return { message: "Student could be not found" };
    }

    await db.student.update({
      where: {
        id: studentId,
      },
      data: {
        parent: {
          connect: { id: parent.id },
        },
      },
    });

    revalidateTag("parent");

    return { message: "Student added to parent", status: 200 };
  } catch (error) {
    console.error("Error adding Parent:", error);
    return { message: "Error adding Parent", status: 400 };
  }
};
