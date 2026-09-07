import { NextRequest, NextResponse } from "next/server";

import { assertRateLimit } from "@/lib/admin/request-security";
import { registerAccount } from "@/lib/auth/register-account";

const MOBILE_ROLES = new Set(["parent", "driver"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const accountRole = String(body.accountRole || "").toLowerCase();
  const email = String(body.email || "").trim().toLowerCase();

  if (!MOBILE_ROLES.has(accountRole)) {
    return NextResponse.json(
      { code: "INVALID_ROLE", message: "Sign up in the app as a parent or driver. Schools register on the web." },
      { status: 400 }
    );
  }

  try {
    assertRateLimit(`mobile-register:${email || "anonymous"}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  } catch {
    return NextResponse.json(
      { code: "RATE_LIMITED", message: "Too many sign-up attempts. Please try again later." },
      { status: 429 }
    );
  }

  const result = await registerAccount({ ...body, accountRole, email });
  if (!result.ok) {
    return NextResponse.json(
      {
        code: result.status === 409 ? "CONFLICT" : result.status === 400 ? "INVALID_REQUEST" : "REGISTRATION_FAILED",
        message: result.message,
        details: result.details,
      },
      { status: result.status }
    );
  }

  return NextResponse.json(
    {
      message: "Account created. Check your email to verify your address, then sign in.",
      email: result.email,
      role: result.role,
    },
    { status: 201 }
  );
}
