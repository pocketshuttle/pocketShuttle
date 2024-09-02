import crypto from "crypto";
const MAGICBELL_API_SECRET = "b5ad8d7c5bbc6dccaceade3a242d4bc35c4dc665";
export function generateUserHmac(userId: string) {
  const secret = MAGICBELL_API_SECRET;
  if (!secret) {
    throw new Error("MAGICBELL_API_SECRET environment variable is not set.");
  }
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(userId);
  return hmac.digest("hex");
}
