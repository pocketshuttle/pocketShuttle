export type BillingProviderEnvironmentValue = "TEST" | "LIVE";

export function paystackEnvironmentFromSecret(
  secret = process.env.PAYSTACK_SECRET_KEY
): BillingProviderEnvironmentValue | null {
  if (!secret) return null;
  if (secret.startsWith("sk_test_")) return "TEST";
  if (secret.startsWith("sk_live_")) return "LIVE";
  throw new Error("PAYSTACK_SECRET_KEY is not a recognized Paystack secret key");
}
