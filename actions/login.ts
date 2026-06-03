"use server";

import { LoginSchema } from "@/schemas";
import * as z from "zod";
import {
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_USER_ROLE,
  DEFAULT_PARENT_ROLE,
} from "@/routes";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { setSessionCookie } from "@/lib/create-session";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export const Login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  //validating the data
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Details" };
  }
  const { email, password, role: userRole } = validatedFields.data;

  const existingUser = await getUserByEmail(email, userRole);

  // Check if user exists
  if (!existingUser || !existingUser.password || !existingUser.email) {
    return { error: "Invalid Credentials!" };
  }
  // Verify email if needed
  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email,
      existingUser.role
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    // Redirect instead of just returning a message
    redirect("/confirm-email");
  }

  // Check password validity
  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    return { error: "Invalid Credentials!" };
  }

  // Prepare session data
  const id = existingUser?.id;
  const role = existingUser?.role;
  //@ts-ignore
  const name = existingUser?.name || existingUser?.full_name;
  const image = existingUser?.image;
  //@ts-ignore
  const schoolId = existingUser?.schoolId;

  try {
    await setSessionCookie({
      id,
      role,
      name,
      image,
      email: existingUser.email,
      schoolId,
    });
  } catch (error: unknown) {
    return { error: "Invalid Credentials!" };
  }

  // Determine redirect URL
  const redirectTo =
    role === "parent"
      ? DEFAULT_PARENT_ROLE
      : role === "teacher"
        ? DEFAULT_USER_ROLE
        : callbackUrl || DEFAULT_LOGIN_REDIRECT;

  redirect(redirectTo);
};
