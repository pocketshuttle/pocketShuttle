"use server";

import { LoginSchema } from "@/schemas";
import * as z from "zod";
import { signIn } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_USER_ROLE,
  DEFAULT_PARENT_ROLE,
} from "@/routes";
// import { AuthError } from "next-auth/authError";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { encrypt } from "@/lib/create-session";
import { cookies } from "next/headers";
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

  if (!existingUser || !existingUser.password || !existingUser.email) {
    return { error: "Invalid Credentials!" };
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    return { error: "Invalid Credentials!" };
  }

  const id = existingUser?.id;
  const role = existingUser?.role;
  const name = existingUser?.name || existingUser?.full_name;
  const image = existingUser?.image;

  // if (!existingUser.emailVerified) {
  //   const verificationToken = await generateVerificationToken(
  //     existingUser.email
  //   );

  //   await sendVerificationEmail(
  //     verificationToken.email,
  //     verificationToken.token
  //   );

  //   return { success: "Confirmation email sent, please verify your account!" };
  // }

  try {
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ id, role, name, image });

    cookies().set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      // sameSite: "lax",
      // path: "/",
    });

    //   const signInParams = {
    //     email,
    //     password,
    //     redirectTo:
    //       role === "parent"
    //         ? DEFAULT_PARENT_ROLE
    //         : role === "teacher"
    //         ? DEFAULT_USER_ROLE
    //         : callbackUrl || DEFAULT_LOGIN_REDIRECT,
    //   };

    //   if (role) {
    //     //@ts-ignore
    //     signInParams.role = role;
    //   }

    //   await signIn("credentials", {
    //     redirect: true,
    //     ...signInParams,
    //   });
  } catch (error: unknown) {
    console.log(error);
    // if (error instanceof AuthError) {
    //   switch (error.type) {
    //     case "CredentialsSignin":
    //       return { error: "Invalid Credentials!" };
    //     default:
    //       return { error: "Something went wrong!" };
    //   }
    // }
    // throw error;
  }
  redirect("/dashboard");

  return { success: "Login Successful" };
};
