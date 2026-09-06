import { NextRequest, NextResponse } from "next/server";

import { assertRateLimit } from "@/lib/admin/request-security";
import { rotateMobileSession } from "@/lib/mobile/auth";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";
import { hashMobileToken } from "@/lib/mobile/policy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken = String(body.refreshToken || "");
    if (refreshToken.length < 32) {
      throw new MobileApiError(
        "INVALID_REQUEST",
        400,
        "A refresh token is required."
      );
    }
    assertRateLimit(`mobile-refresh:${hashMobileToken(refreshToken)}`, {
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    return NextResponse.json(await rotateMobileSession(refreshToken));
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return mobileErrorResponse(
        new MobileApiError(
          "RATE_LIMITED",
          429,
          "Too many refresh attempts. Sign in again."
        )
      );
    }
    return mobileErrorResponse(error);
  }
}
