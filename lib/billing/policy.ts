import { EntitlementValue } from "@/lib/billing/catalog";

export function isUsableSubscription(
  status: string,
  currentPeriodEnd: Date | null,
  graceEndsAt: Date | null,
  now = new Date()
) {
  const timestamp = now.getTime();
  if (status === "PAST_DUE") {
    return !!graceEndsAt && graceEndsAt.getTime() > timestamp;
  }
  if (!["ACTIVE", "TRIALING", "NON_RENEWING"].includes(status)) return false;
  return !currentPeriodEnd || currentPeriodEnd.getTime() > timestamp;
}

export function limitAllows(
  configuredValue: EntitlementValue | undefined,
  current: number,
  increment = 1
) {
  if (configuredValue === null) return true;
  const limit = typeof configuredValue === "number" ? configuredValue : 0;
  return current + increment <= limit;
}

export function historyCutoffForHours(
  configuredValue: EntitlementValue | undefined,
  now = new Date()
) {
  if (configuredValue === null) return null;
  const hours = typeof configuredValue === "number" ? configuredValue : 24;
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}
