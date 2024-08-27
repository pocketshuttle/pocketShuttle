"use server";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

export const confirmParent = async (
  studentId: string,
  parentId: string,
  confirmation?: string
) => {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { parent: true }, // Include parent information
    });

    if (!student) {
      return { message: "Student not found" };
    }
    if (confirmation === "yes") {
      //if the student is confirmed to change parent id, we first disconnect it from the previous parent before updating it
      const oldParent = await db.parent.update({
        where: { id: parentId },
        data: {
          Student: {
            disconnect: { id: student?.id },
          },
        },
      });

      //we also disconnect from the student
      await db.student.update({
        where: {
          id: studentId,
        },
        data: {
          parent: {
            disconnect: { id: oldParent.id },
          },
        },
      });

      //then  we update this current parent with the id
      const updatedParent = await db.parent.update({
        where: { id: parentId },
        data: {
          Student: {
            connect: { id: studentId },
          },
        },
      });

      //we also update the student
      await db.student.update({
        where: {
          id: studentId,
        },
        data: {
          parent: {
            connect: { id: updatedParent.id },
          },
        },
      });
    }
    revalidateTag("parent");

    return { message: "Student successfully added to parent" };
  } catch (error) {
    console.error("Error adding Parent:", error);
    return { message: "An error occurred while adding the parent" };
  }
};
