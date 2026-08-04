import crypto from "crypto";

export function createTripViewerInviteToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashTripViewerInviteToken(token) };
}

export function hashTripViewerInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function viewerInviteExpiry(days = 7) {
  const safeDays = Math.min(30, Math.max(1, Math.round(days)));
  return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
}
