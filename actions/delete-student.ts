"use server";
import { db } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";

export const handleDelete = async (id: string, mode: string) => {
  try {
    if (mode === "student") {
      await db.student.delete({
        where: {
          id: id,
        },
      });
      revalidateTag("student");
    } else if (mode === "teacher") {
      await db.teacher.delete({
        where: {
          id: id,
        },
      });
    } else if (mode === "driver") {
      await db.driver.delete({
        where: {
          id: id,
        },
      });
    } else if (mode === "parent") {
      await db.parent.delete({
        where: {
          id: id,
        },
      });
    } else if (mode === "bus") {
      await db.buses.delete({
        where: {
          id: id,
        },
      });
      revalidateTag("bus");
    }

    // revalidatePath(`/dashboard/student/${id}`);
    return { message: `${mode} deleted successfully` };
  } catch (error) {
    console.error("Error during deletion:", error);
    return { error: "Deleting failed. Please try again." };
  }
};
