"use server";
import { RegisterSchema } from "@/schemas";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields" };
  }

  const { schoolname, email, password } = validatedFields.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use!" };
    }

    await db.user.create({
      data: {
        name: schoolname,
        email,
        password: hashedPassword,
      },
    });

    return { success: "Successfully Registered" };
  } catch (error) {
    console.error("Error during registration:", error);
    return { error: "Registration failed. Please try again." };
  }
};
