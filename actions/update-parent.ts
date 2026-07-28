"use server";
import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";
import { ParentUpdateSchema } from "@/schemas";
import bcrypt from "bcryptjs";

export const updateParent = async (parentId: string | undefined, data: any) => {
  try {
    const user = await getUserSession();
    if (
      !user ||
      !["teacher", "admin", "school", "ADMIN"].includes(user.role as string)
    ) {
      return { message: "Unauthorized", status: 401 };
    }

    if (!parentId) {
      return { message: "Parent ID is required", status: 400 };
    }

    const validatedData = ParentUpdateSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        message: "Validation failed",
        errors: validatedData.error.flatten().fieldErrors,
        status: 400,
      };
    }

    const values = validatedData.data;

    if (data.email) {
      const existingParent = await db.parent.findUnique({
        where: { email: values.email.toLowerCase() },
      });
      if (existingParent && existingParent.id !== parentId) {
        return {
          message: "Email is already in use by another parent",
          status: 400,
        };
      }
    }

    const updateData: any = {
      busId: values.busId || undefined,
      full_name: values.full_name,
      address: values.address,
      addressCoords: values.addressCoords,
      image: values.image,
      email: values.email.toLowerCase(),
      role: values.role,
      phoneNumber: values.phoneNumber,
    };

    // hash password if present
    if (values.password) {
      const hashedPassword = await bcrypt.hash(values.password, 10);
      updateData.password = hashedPassword;
    }

    //  connect to school instead of using `schoolId`
    if (values.school_id) {
      updateData.school = {
        connect: { id: values.school_id },
      };
    }

    await db.parent.update({
      where: { id: parentId },
      data: updateData,
    });

    return { message: "Parent updated successfully", status: 200 };
  } catch (error) {
    console.error("Error updating parent:", error);
    return { message: "Error updating parent", status: 400 };
  }
};
