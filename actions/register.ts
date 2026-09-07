"use server";
import * as z from "zod";
import { redirect } from "next/navigation";

import { registerAccount } from "@/lib/auth/register-account";
import { RegisterSchema } from "@/schemas";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const result = await registerAccount(values);
  if (!result.ok) {
    return { error: result.status === 400 ? "Invalid Fields" : result.message };
  }
  redirect("/confirm-email");
};
