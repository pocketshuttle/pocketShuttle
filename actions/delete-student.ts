import { db } from "@/lib/db";

export const handleDelete = async ({ id }: string) => {
  console.log(id);
  try {
    const deletedStudent = await db.student.delete({
      where: {
        id: id,
      },
    });
    // Return success message if the student is deleted
    return { message: "Student deleted successfully" };
  } catch (error) {
    console.error("Error during deletion:", error);
    return { error: "Deleting failed. Please try again." };
  }
};
