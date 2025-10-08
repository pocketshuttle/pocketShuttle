"use server";
import bcrypt from "bcryptjs";
import  db  from "@/packages/db/client";
import { ParentSchema } from "@/schemas";
import { revalidateTag } from "next/cache";
import * as z from "zod";
import { NextResponse } from "next/server";

export const addNewParent = async (values: z.infer<typeof ParentSchema>) => {
  try {
    // Validate the input data using Zod schema
    const validatedData = ParentSchema.safeParse(values);
    if (!validatedData.success) {
      return { message: validatedData.error.errors, status: 500 };
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

    const hashPassword = await bcrypt.hash(password, 10);

    // Create a new parent entry in the database
    const newParent = await db.parent.create({
      data: {
        school: {
          connect: { id: school_id },
        },
        full_name,
        email,
        phoneNumber,
        password: hashPassword,
        address,
        addressCoords,
        ...(studentId && {
          Student: {
            connect: { id: studentId },
          },
        }),
        image,
        role,
      },
    });

    await db.newUser.create({
      data: {
        school: {
          connect: { id: school_id },
        },
        email,
        password: hashPassword,
        parent: {
          connect: { id: newParent.id },
        },
      },
    });

    // Revalidate bus-related caches after adding a bus
    revalidateTag("parent");

    return { message: "Parent added Succesfully ", status: 200 };
  } catch (error) {
    // Handle errors
    console.error("Error adding Parent:", error);
    return { message: "Error adding Parent", status: 500 };
  }
};
