"use server";
import * as z from "zod";

import { ResetPasswordSchema } from "@/schemas";

import { getUserByEmail } from "@/data/user";
import { getUserSession } from "@/lib/session";
import { generatePasswordResetToken } from "@/lib/token";
import { sendResetPasswordEmail } from "@/lib/mail";
import db from "@/packages/db/client";

export const reset = async (values: z.infer<typeof ResetPasswordSchema>) => {
  const validatedFields = ResetPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email or role!" };
  }

  const { email, role } = validatedFields.data;

  const existingUser = await getUserByEmail(email, role);

  if (!existingUser || !existingUser.email) {
    return { error: "User not found!" };
  }

  const resetPasswordToken = await generatePasswordResetToken(
    existingUser.email,
    role
  );

  await sendResetPasswordEmail(
    resetPasswordToken.email,
    resetPasswordToken.token
  );

  return { success: "Reset Email sent!" };
};

export const resetCurrentUserPassword = async () => {
  const session = await getUserSession();
  const role = String(session?.role ?? "").toLowerCase();
  const schoolId = String(session?.schoolId ?? session?.id ?? "");

  if (!schoolId || !["admin", "school"].includes(role)) {
    return { error: "Only school admins can request this reset." };
  }

  const user = await db.user.findUnique({
    where: { id: schoolId },
    select: { email: true },
  });

  if (!user?.email) {
    return { error: "No admin email is configured for this account." };
  }

  const resetPasswordToken = await generatePasswordResetToken(
    user.email,
    "admin"
  );

  await sendResetPasswordEmail(
    resetPasswordToken.email,
    resetPasswordToken.token
  );

  return { success: "Reset email sent to the admin account." };
};
