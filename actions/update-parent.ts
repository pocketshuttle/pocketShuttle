"use server";
import db from "@/packages/db/client";
import { ParentProps } from "@/types";
import bcrypt from "bcryptjs";

export const updateParent = async (parentId: string | undefined, data: any) => {
  try {
    if (data.email) {
      const existingParent = await db.parent.findUnique({
        where: { email: data.email },
      });
      if (existingParent && existingParent.id !== parentId) {
        return {
          message: "Email is already in use by another parent",
          status: 400,
        };
      }
    }

    const updateData: any = {
      busId: data.busId || undefined,
      full_name: data.full_name,
      address: data.address,
      addressCoords: data.addressCoords,
      image: data.image,
      email: data.email,
      role: data.role,
      phoneNumber: data.phoneNumber,
    };

    // hash password if present
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    //  connect to school instead of using `schoolId`
    if (data.school_id) {
      updateData.school = {
        connect: { id: data.school_id },
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
