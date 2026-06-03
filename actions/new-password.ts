"use server";
import * as z from "zod";

import { NewPasswordSchema } from "@/schemas";
import { getResetPasswordTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";
import db from "@/packages/db/client";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) {
    return { error: "Missing token!" };
  }
  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password } = validatedFields.data;

  const existingToken = await getResetPasswordTokenByToken(token);

  if (!existingToken) {
    return { error: "Invalid Token!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const tokenRole = String(existingToken.role || "admin").toLowerCase();
  const existingUser = await getUserByEmail(existingToken.email, tokenRole);

  if (!existingUser || !existingUser.password) {
    return { error: "Email not found!" };
  }

  const isSamePassword = await bcrypt.compare(password, existingUser.password);

  if (isSamePassword) {
    return { error: "You cannot use your previous password!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (tokenRole !== "admin") {
    if (tokenRole === "teacher") {
      await db.teacher.update({
        where: {
          id: existingUser.id,
        },
        data: {
          emailVerified: new Date(),
          email: existingToken.email,
          password: hashedPassword,
        },
      });
    } else if (tokenRole === "parent") {
      await db.parent.update({
        where: {
          id: existingUser.id,
        },
        data: {
          emailVerified: new Date(),
          email: existingToken.email,
          password: hashedPassword,
        },
      });
    } else {
      return { error: "Invalid account role!" };
    }
  } else {
    await db.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
        password: hashedPassword,
      },
    });
  }

  await db.resetPasswordToken.delete({ where: { id: existingToken.id } });

  return { success: "Password reset successfully!" };
};
