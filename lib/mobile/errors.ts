import { NextResponse } from "next/server";

export type MobileErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "EMAIL_VERIFICATION_REQUIRED"
  | "ACCOUNT_SUSPENDED"
  | "INVALID_ROLE"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED";

export class MobileApiError extends Error {
  constructor(
    public code: MobileErrorCode,
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export function mobileErrorResponse(error: unknown) {
  if (error instanceof MobileApiError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status }
    );
  }
  console.error("[mobile-api]", error);
  return NextResponse.json(
    { code: "INVALID_REQUEST", message: "The request could not be completed." },
    { status: 400 }
  );
}
