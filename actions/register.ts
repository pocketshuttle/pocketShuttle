"use server";
import { RegisterSchema } from "@/schemas";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import User from "@/(models)/User";
import { connectToDB } from "@/utils/connect-to-db";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  await connectToDB();
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields" };
  }

  const { schoolname, email, password } = validatedFields.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return { error: "Email already in use!" };
    }
    const user = new User({
      name: schoolname,
      email,
      password: hashedPassword,
    });

    // await db.user.create({
    //   data: {
    //     name: schoolname,
    //     email,
    //     password: hashedPassword,
    //   },
    // });
    await user.save();

    return { success: "Successfully Registered" };
  } catch (error) {
    console.error("Error during registration:", error);
    return { error: "Registration failed. Please try again." };
  }
};
