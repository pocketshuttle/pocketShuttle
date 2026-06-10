"use server";
import { cookies } from "next/headers";
import { decrypt } from "./create-session";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { cache } from "react";
import { redirect } from "next/navigation";

export const getUserSession = cache(async () => {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!cookie) {
    console.log("No cookie found");
    redirect("/login");
  }

  const session = await decrypt(cookie);

  if (!session?.id) {
    redirect("/login");
  }

  return session;
});
