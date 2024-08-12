"use server";
import * as z from "zod";

import { NewPasswordSchema } from "@/schemas";
import { getResetPasswordTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";
import User from "@/(models)/User";
import ResetPasswordToken from "@/(models)/ResetPassword";
import { db } from "@/lib/db";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) {
    return { error: "Misssing Token!" };
  }
  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password } = validatedFields.data;

  const existingToken = await getResetPasswordTokenByToken(token);
  console.log("existing token", existingToken);

  if (!existingToken) {
    return { error: "Invalid Token!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);
  console.log("existing user", existingUser);

  if (!existingUser) {
    return { error: "Email not found!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });
  await db.resetPasswordToken.delete({ where: { id: existingToken.id } });

  return { success: "Password reset successfully!" };
};
