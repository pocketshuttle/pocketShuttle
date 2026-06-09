"use server";
import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";
import { revalidatePath, revalidateTag } from "next/cache";

export const handleDelete = async (id: string, mode: string) => {
  try {
    const user = await getUserSession();
    if (!user) {
      return { message: "Unauthorized: Please log in", status: 401 };
    }

    //  Authorization
    if (!["admin", "school", "ADMIN"].includes(user.role as string)) {
      return { message: "Forbidden: You do not have permission", status: 403 };
    }

    if (!id || !mode) {
      return { message: "Invalid request parameters", status: 400 };
    }
    const schoolId = String(user.schoolId ?? user.id ?? "");

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
      revalidateTag("teacher");
    } else if (mode === "driver") {
      const driver = await db.driver.findFirst({
        where: { id, schoolId, accountType: "SCHOOL_MANAGED" },
        select: { id: true },
      });
      if (!driver) return { message: "Driver not found", status: 404 };
      await db.driver.delete({
        where: {
          id: id,
        },
      });
      revalidateTag("driver");
    } else if (mode === "parent") {
      const parent = await db.parent.findFirst({
        where: { id, schoolId, accountType: "SCHOOL_MANAGED" },
        select: { id: true },
      });
      if (!parent) return { message: "Parent not found", status: 404 };
      await db.parent.delete({
        where: {
          id: id,
        },
      });
      revalidateTag("parent");
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
