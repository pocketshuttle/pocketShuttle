"use server";

import db from "@/packages/db/client";
import { revalidateTag } from "next/cache";
import { getUserSession } from "@/lib/session";

export const confirmParent = async (
  studentId: string,
  parentId: string,
  confirmation?: string
) => {
  try {
    const user = await getUserSession();
    if (!user || !["admin", "school", "ADMIN"].includes(user.role as string)) {
      return { message: "Unauthorized access", status: 403 };
    }

    if (!studentId || !parentId) {
      return { message: "Missing required IDs", status: 400 };
    }

    const [student, parent] = await Promise.all([
      db.student.findUnique({ where: { id: studentId } }),
      db.parent.findUnique({ where: { id: parentId } }),
    ]);

    if (!student) return { message: "Student not found", status: 404 };
    if (!parent) return { message: "Parent not found", status: 404 };

    if (confirmation !== "yes") {
      return { message: "Confirmation required", status: 400 };
    }

    await db.$transaction(async (tx) => {
      // Disconnect any existing parent from this student (if exists)
      if (student.parentId) {
        await tx.parent.update({
          where: { id: student.parentId },
          data: {
            Student: { disconnect: { id: student.id } },
          },
        });

        await tx.student.update({
          where: { id: student.id },
          data: { parentId: null },
        });
      }

      // Connect new parent to student
      await tx.parent.update({
        where: { id: parentId },
        data: {
          Student: { connect: { id: student.id } },
        },
      });

      await tx.student.update({
        where: { id: student.id },
        data: {
          parent: { connect: { id: parentId } },
        },
      });
    });

    revalidateTag("parent");

    return {
      message: "Parent successfully reassigned to student",
      status: 200,
    };
  } catch (error: any) {
    console.error(" Error confirming parent:", error);

   
    if (error.code === "P2003") {
      return { message: "Invalid relation reference", status: 400 };
    }

    return {
      message: "Internal server error while confirming parent",
      status: 500,
    };
  }
};
