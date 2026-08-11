import { NextRequest, NextResponse } from "next/server";

import { deleteSessionCookie } from "@/lib/create-session";
import { LAST_SCREEN_COOKIE_NAME } from "@/lib/auth-cookies";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  await deleteSessionCookie();
  (await cookies()).delete(LAST_SCREEN_COOKIE_NAME);

  const reason = req.nextUrl.searchParams.get("reason");
  const loginUrl = new URL("/login", req.url);
  if (reason) {
    loginUrl.searchParams.set("reason", reason);
  }

  return NextResponse.redirect(loginUrl);
}
