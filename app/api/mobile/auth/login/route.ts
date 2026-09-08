import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { assertRateLimit } from "@/lib/admin/request-security";
import {
  createMobileLoginSession,
  findMobileActorByEmail,
} from "@/lib/mobile/auth";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";
import { normalizeMobileRole } from "@/lib/mobile/policy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = normalizeMobileRole(body.role);
    const installationId = String(body.installationId || "").trim();
    const platform = String(body.platform || "ANDROID").toUpperCase();
    if (
      !email.includes("@") ||
      !password ||
      !role ||
      installationId.length < 8 ||
      installationId.length > 200 ||
      !["ANDROID", "IOS"].includes(platform)
    ) {
      throw new MobileApiError(
        "INVALID_REQUEST",
        400,
        "Email, password, role, and installation ID are required."
      );
    }
    assertRateLimit(`mobile-login:${email}:${role}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    const { actor, password: passwordHash } = await findMobileActorByEmail(
      email,
      role
    );
    if (!(await bcrypt.compare(password, passwordHash))) {
      throw new MobileApiError(
        "INVALID_CREDENTIALS",
        401,
        "Invalid credentials."
      );
    }
    const session = await createMobileLoginSession({
      actor,
      installationId,
      platform: platform as "ANDROID" | "IOS",
      deviceName:
        typeof body.deviceName === "string"
          ? body.deviceName.trim().slice(0, 120)
          : null,
      appVersion:
        typeof body.appVersion === "string"
          ? body.appVersion.trim().slice(0, 40)
          : null,
    });
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return mobileErrorResponse(
        new MobileApiError(
          "RATE_LIMITED",
          429,
          "Too many sign-in attempts. Try again later."
        )
      );
    }
    return mobileErrorResponse(error);
  }
}
