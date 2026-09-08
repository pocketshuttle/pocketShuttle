import { NextRequest, NextResponse } from "next/server";

import { getUserByEmail } from "@/data/user";
import { assertRateLimit } from "@/lib/admin/request-security";
import { sendResetPasswordEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/token";
import { ResetPasswordSchema } from "@/schemas";

const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a password reset link.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: "Enter a valid email and choose your role.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  try {
    assertRateLimit(`mobile-reset:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  } catch {
    return NextResponse.json(
      { code: "RATE_LIMITED", message: "Too many reset requests. Please try again later." },
      { status: 429 }
    );
  }

  const existing = await getUserByEmail(email, parsed.data.role);
  if (existing?.email) {
    const token = await generatePasswordResetToken(existing.email, parsed.data.role);
    await sendResetPasswordEmail(token.email, token.token);
  }

  // Deliberately identical response whether or not the account exists.
  return NextResponse.json({ message: GENERIC_MESSAGE });
}
