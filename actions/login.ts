"use server";

import { LoginSchema } from "@/schemas";
import * as z from "zod";
import { signIn } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_USER_ROLE,
  DEFAULT_PARENT_ROLE,
} from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";

export const Login = async (values: z.infer<typeof LoginSchema>) => {
  //validating the data
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields" };
  }
  const { email, password, role } = validatedFields.data;

  const existingUser = await getUserByEmail(email, role);

  if (!existingUser || !existingUser.password || !existingUser.email) {
    return { error: "Invalid Credentials!" };
  }

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
    const signInParams = {
      email,
      password,
      redirectTo:
        role === "parent"
          ? DEFAULT_PARENT_ROLE
          : role === "teacher"
          ? DEFAULT_USER_ROLE
          : DEFAULT_LOGIN_REDIRECT,
    };

    if (role) {
      //@ts-ignore
      signInParams.role = role;
    }

    await signIn("credentials", {
      ...signInParams,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
  return { success: "Login Successful" };
};
