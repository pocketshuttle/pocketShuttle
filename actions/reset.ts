"use server";
import * as z from "zod";

import { ResetPasswordSchema } from "@/schemas";

import { getUserByEmail } from "@/data/user";
import {
  generatePasswordResetToken,
  generateVerificationToken,
} from "@/lib/token";
import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/mail";

export const reset = async (values: z.infer<typeof ResetPasswordSchema>) => {
  const validatedFields = ResetPasswordSchema.safeParse(values);
  console.log(validatedFields, "from validated fieldss");

  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email, role } = validatedFields.data;

  const existingUser = await getUserByEmail(email, role);

  if (!existingUser) {
    return { error: "User not found!" };
  }

  const resetPasswordToken = await generatePasswordResetToken(
    existingUser.email || "",
    role
  );

  await sendResetPasswordEmail(
    resetPasswordToken.email,
    resetPasswordToken.token
  );

  return { success: "Reset Email sent!" };
};
