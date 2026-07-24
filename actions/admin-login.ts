"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";

import { LoginSchema } from "@/schemas";
import { setSessionCookie } from "@/lib/create-session";
import { assertRateLimit, normalizeAdminEmail } from "@/lib/admin/request-security";
import db from "@/packages/db/client";

export const AdminLogin = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid details" };
  }

  const { email, password } = validatedFields.data;
  const normalizedEmail = normalizeAdminEmail(email);
  try {
    assertRateLimit(`admin-login:${normalizedEmail}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
  } catch {
    return { error: "Too many login attempts. Please try again later." };
  }
  const superUser = await db.superUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!superUser?.password || superUser.status !== "ACTIVE") {
    return { error: "Invalid credentials" };
  }

  const isPasswordValid = await bcrypt.compare(password, superUser.password);
  if (!isPasswordValid) {
    return { error: "Invalid credentials" };
  }

  await db.superUser.update({
    where: { id: superUser.id },
    data: { lastLoginAt: new Date() },
  });

  await setSessionCookie({
    id: superUser.id,
    role: "superadmin",
    name: superUser.name,
    email: superUser.email.toLowerCase(),
    schoolId: null,
    platformAccessRole: superUser.accessRole,
  });

  redirect("/admin");
};
