import { EntitlementValue } from "@/lib/billing/catalog";

export const DRIVER_SLOT_STATUSES = [
  "INVITED",
  "DRIVER_REQUESTED",
  "PARENT_APPROVED",
] as const;

export function connectionConsumesDriverSlot(status?: string | null) {
  return !!status && (DRIVER_SLOT_STATUSES as readonly string[]).includes(status);
}

export function driverSlotIncrement(existingStatus?: string | null) {
  return connectionConsumesDriverSlot(existingStatus) ? 0 : 1;
}

export function defaultBillingEnforcement(
  accountType: "FAMILY" | "SCHOOL" | "ORGANIZATION"
) {
  return accountType !== "SCHOOL";
}

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
