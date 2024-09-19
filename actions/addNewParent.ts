"use server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ParentSchema } from "@/schemas";
import { revalidateTag } from "next/cache";
import * as z from "zod";
import { NextResponse } from "next/server";

export const addNewParent = async (values: z.infer<typeof ParentSchema>) => {
  try {
    // Validate the input data using Zod schema
    const validatedData = ParentSchema.safeParse(values);
    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const {
      school_id,
      full_name,
      email,
      phoneNumber,
      address,
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

    return Response.json(
      { message: "Parent added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error("Error adding Parent:", error);
    return NextResponse.json(
      {
        message: "Error adding Parent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
