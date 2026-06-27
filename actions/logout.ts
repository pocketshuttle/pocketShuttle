"use server";

import { deleteSessionCookie } from "@/lib/create-session";
import { LAST_SCREEN_COOKIE_NAME } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function deleteSession() {
  await deleteSessionCookie();
  (await cookies()).delete(LAST_SCREEN_COOKIE_NAME);
}
export async function logout(callbackUrl?: string) {
  await deleteSession();

  const loginRedirect = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  redirect(loginRedirect);
}
