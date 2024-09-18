"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function deleteSession() {
  cookies().delete("session");
}
export async function logout(callbackUrl?: string) {
  await deleteSession();

  const loginRedirect = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  redirect(loginRedirect);
}
