import crypto from "crypto";

export function generateUserHmac(userId: string) {
  const secret = process.env.MAGICBELL_API_SECRET;
  if (!secret) {
    throw new Error("MAGICBELL_API_SECRET environment variable is not set.");
  }
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(userId);
  return hmac.digest("hex");
}
