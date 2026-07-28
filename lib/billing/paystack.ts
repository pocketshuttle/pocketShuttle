import "server-only";

import { paystackEnvironmentFromSecret } from "@/lib/billing/provider-environment";

export async function createPaystackMonthlyPlan(input: {
  name: string;
  amountMinor: number;
  currency: string;
}) {
  const environment = paystackEnvironmentFromSecret();
  if (!process.env.PAYSTACK_SECRET_KEY || !environment) return null;

  const response = await fetch("https://api.paystack.co/plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      amount: input.amountMinor,
      currency: input.currency,
      interval: "monthly",
      invoice_limit: 0,
      send_invoices: true,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.data?.plan_code) {
    throw new Error(payload?.message || "Unable to create Paystack plan");
  }
  return {
    planCode: String(payload.data.plan_code),
    environment,
  };
}
