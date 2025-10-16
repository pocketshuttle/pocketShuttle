"use server";

import bcrypt from "bcryptjs";
import db from "@/packages/db/client";
import { ParentSchema } from "@/schemas";
import { revalidateTag } from "next/cache";
import * as z from "zod";
import { getUserSession } from "@/lib/session";

export const addNewParent = async (values: z.infer<typeof ParentSchema>) => {
  try {
    // Authenticate and authorize the user
    const user = await getUserSession();
    if (!user || !["admin", "school", "ADMIN"].includes(user.role as string)) {
      return {
        message: "Unauthorized: Only admins or school staff can add parents.",
        status: 403,
      };
    }

    //  Validate input using Zod
    const validatedData = ParentSchema.safeParse(values);
    if (!validatedData.success) {
      return {
        message: "Validation failed",
        errors: validatedData.error.flatten().fieldErrors,
        status: 400,
      };
    }

    const {
      school_id,
      full_name,
      email,
      phoneNumber,
      address,
      addressCoords,
      studentId,
      image,
      password,
      role,
    } = validatedData.data;

    // 3Check for existing email to prevent duplicates
    const existingParent = await db.parent.findUnique({ where: { email } });
    if (existingParent) {
      return { message: "Email already in use", status: 409 };
    }

    const [schoolExists, studentExists] = await Promise.all([
      db.user.findUnique({ where: { id: school_id } }),
      studentId ? db.student.findUnique({ where: { id: studentId } }) : null,
    ]);

    if (!schoolExists) return { message: "Invalid school ID", status: 404 };
    if (studentId && !studentExists)
      return { message: "Invalid student ID", status: 404 };

    const hashPassword = await bcrypt.hash(password, 12);

    const result = await db.$transaction(async (tx) => {
      const newParent = await tx.parent.create({
        data: {
          school: { connect: { id: school_id } },
          full_name,
          email: email.toLowerCase(),
          phoneNumber,
          password: hashPassword,
          address,
          addressCoords,
          ...(studentId && { Student: { connect: { id: studentId } } }),
          image,
          role: role || "PARENT",
        },
      });

      await tx.newUser.create({
        data: {
          school: { connect: { id: school_id } },
          email: email.toLowerCase(),
          password: hashPassword,
          parent: { connect: { id: newParent.id } },
        },
      });

      return newParent;
    });

    revalidateTag("parent");

    return { message: "Parent added successfully", status: 200, id: result.id };
  } catch (error: any) {
    console.error(" Error adding Parent:", error);

    // Handle known Prisma or validation errors gracefully
    if (error.code === "P2002") {
      return { message: "Duplicate entry (e.g. email)", status: 409 };
    }
    if (error.code === "P2003") {
      return { message: "Invalid relation reference", status: 400 };
    }

    return { message: "Internal server error", status: 500 };
  }
};
