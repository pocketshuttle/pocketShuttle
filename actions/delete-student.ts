"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const handleDelete = async (id: string, mode: string) => {
  console.log("deleted ID", id, mode);

  try {
    if (mode === "student") {
      await db.student.delete({
        where: {
          id: id,
        },
      });
    } else if (mode === "teacher") {
      await db.teacher.delete({
        where: {
          id: id,
        },
      });
    }

    // revalidatePath(`/dashboard/student/${id}`);
    return { message: `${mode} deleted successfully` };
  } catch (error) {
    console.error("Error during deletion:", error);
    return { error: "Deleting failed. Please try again." };
  }
};
