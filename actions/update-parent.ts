"use server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const updateParent = async (parentId: string | undefined, data: any) => {
  try {
    const updateData: any = {
      schoolId: data.school_id,
      busId: data.busId || undefined,
      full_name: data.full_name,
      address: data.address,
      image: data.image,
      email: data.email,
      role: data.role,
    };

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
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
