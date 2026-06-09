"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";

import { LoginSchema } from "@/schemas";
import { setSessionCookie } from "@/lib/create-session";
import db from "@/packages/db/client";

export const AdminLogin = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid details" };
  }

  const { email, password } = validatedFields.data;
  const superUser = await db.superUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!superUser?.password) {
    return { error: "Invalid credentials" };
  }

  const isPasswordValid = await bcrypt.compare(password, superUser.password);
  if (!isPasswordValid) {
    return { error: "Invalid credentials" };
  }

  await setSessionCookie({
    id: superUser.id,
    role: "superadmin",
    name: superUser.name,
    email: superUser.email.toLowerCase(),
    schoolId: null,
  });

  redirect("/admin");
};
