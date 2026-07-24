import crypto from "crypto";

const windows = new Map<string, { count: number; resetAt: number }>();

export function normalizeAdminEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function createAdminInviteToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashAdminInviteToken(token) };
}

export function hashAdminInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function adminInviteExpiresAt() {
  return new Date(Date.now() + 48 * 60 * 60 * 1000);
}

export function platformAdminInviteAcceptanceState(input: {
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: Date;
  now?: Date;
}) {
  if (input.status !== "PENDING") return "UNAVAILABLE" as const;
  if (input.expiresAt <= (input.now ?? new Date())) return "EXPIRED" as const;
  return "ACCEPTABLE" as const;
}

export function platformBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(platformBaseUrl()).origin;
  if (new URL(origin).origin !== expected) {
    throw new Error("INVALID_ORIGIN");
  }
}

export function assertRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }
  if (current.count >= options.limit) {
    throw new Error("RATE_LIMITED");
  }
  current.count += 1;
}

export function sanitizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        ([key]) =>
          ![
            "password",
            "token",
            "tokenHash",
            "secret",
            "secretCiphertext",
            "providerEmailToken",
            "authorizationUrl",
          ].includes(key)
      )
      .map(([key, entry]) => [key, sanitizeAuditValue(entry)])
  );
}
