import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { decrypt } from "@/lib/create-session";

export async function getOptionalSession() {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const session = await decrypt(cookie);
  if (!session?.id) return null;

  return session;
}
