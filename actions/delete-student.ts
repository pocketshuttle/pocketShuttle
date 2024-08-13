"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const handleDelete = async (id: string) => {
  console.log("deleted ID", id);
  try {
    await db.student.delete({
      where: {
        id: id,
      },
    });
    revalidatePath(`/dashboard/student/${id}`);
    // Return success message if the student is deleted
    return { message: "Student deleted successfully" };
  } catch (error) {
    console.error("Error during deletion:", error);
    return { error: "Deleting failed. Please try again." };
  }
};
