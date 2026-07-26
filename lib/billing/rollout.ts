export const BILLING_ROLLOUT_FLAGS = {
  PAID_CHECKOUT: "paidCheckout",
} as const;

export function hasBillingRolloutFlag(
  value: unknown,
  flag: (typeof BILLING_ROLLOUT_FLAGS)[keyof typeof BILLING_ROLLOUT_FLAGS]
) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>)[flag] === true
  );
}
