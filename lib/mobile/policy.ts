import crypto from "crypto";

export const MOBILE_ROLES = ["parent", "driver", "teacher"] as const;
export type MobileRole = (typeof MOBILE_ROLES)[number];

export const MOBILE_ACCESS_TTL_SECONDS = 15 * 60;
export const MOBILE_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeMobileRole(value: unknown): MobileRole | null {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";
  return MOBILE_ROLES.includes(role as MobileRole) ? (role as MobileRole) : null;
}

export function mobilePrismaRole(role: MobileRole) {
  return role.toUpperCase() as Uppercase<MobileRole>;
}

export function hashMobileToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createMobileRefreshToken() {
  const token = crypto.randomBytes(48).toString("base64url");
  return { token, tokenHash: hashMobileToken(token) };
}

export function mobileRefreshExpiresAt(now = Date.now()) {
  return new Date(now + MOBILE_REFRESH_TTL_MS);
}

export function shouldTrackDriverLocation(input: {
  role: MobileRole;
  tripStatus?: string | null;
  permissionGranted: boolean;
  sessionActive: boolean;
}) {
  return (
    input.role === "driver" &&
    input.permissionGranted &&
    input.sessionActive &&
    ["active", "paused", "emergency"].includes(
      String(input.tripStatus || "").toLowerCase()
    )
  );
}
