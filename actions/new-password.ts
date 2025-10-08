"use server";
import * as z from "zod";

import { NewPasswordSchema } from "@/schemas";
import { getResetPasswordTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";
import User from "@/(models)/User";
import ResetPasswordToken from "@/(models)/ResetPassword";
import db from "@/packages/db/client";

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

  const { password, role } = validatedFields.data;

  const existingToken = await getResetPasswordTokenByToken(token);

  if (!existingToken) {
    return { error: "Invalid Token!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(
    existingToken.email,
    existingToken.role || ""
  );

  if (!existingUser || !existingUser.password) {
    return { error: "Email not found!" };
  }

  const isSamePassword = await bcrypt.compare(password, existingUser.password);

  if (isSamePassword) {
    return { error: "You cannot use your previous password!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (role && role.toLowerCase() !== "admin") {
    if (role === "teacher") {
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
    } else if (role === "parent") {
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
