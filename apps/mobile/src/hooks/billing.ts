import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../api/client";
import type {
  BillingPlan,
  BillingSubscription,
  CustomPlace,
  NotificationPreference,
  ProWorkspace,
  RecurringTripSuggestion,
  TripTemplate,
  ViewerInvite,
} from "../types";

export const billingKeys = {
  plans: ["billing-plans"] as const,
  subscription: ["billing-subscription"] as const,
  entitlements: ["entitlements"] as const,
  pro: ["parent-pro"] as const,
  places: ["custom-places"] as const,
  templates: ["trip-templates"] as const,
  suggestions: ["recurring-suggestions"] as const,
  preferences: ["notification-preferences"] as const,
  viewerInvites: (tripId: string) => ["viewer-invites", tripId] as const,
};

/** Every key that changes when the plan changes (checkout, cancel, limits). */
export const planDependentKeys = [
  billingKeys.subscription,
  billingKeys.entitlements,
  billingKeys.pro,
  ["mobile-dashboard"],
  ["mobile-trips"],
];

export function useBillingPlans() {
  return useQuery({
    queryKey: billingKeys.plans,
    queryFn: () => apiRequest<{ plans: BillingPlan[] }>("/api/billing/plans?audience=family"),
    select: (data) => data.plans,
    staleTime: 5 * 60_000,
  });
}

export function useBillingSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription,
    queryFn: () => apiRequest<BillingSubscription>("/api/billing/subscription"),
  });
}

export function useParentPro() {
  return useQuery({
    queryKey: billingKeys.pro,
    queryFn: () => apiRequest<ProWorkspace>("/api/parent/pro"),
    refetchInterval: 30_000,
  });
}

export function useCustomPlaces() {
  return useQuery({
    queryKey: billingKeys.places,
    queryFn: () => apiRequest<{ places: CustomPlace[] }>("/api/custom-places"),
    select: (data) => data.places,
  });
}

export function useTripTemplates() {
  return useQuery({
    queryKey: billingKeys.templates,
    queryFn: () => apiRequest<{ templates: TripTemplate[] }>("/api/trip-templates"),
    select: (data) => data.templates,
  });
}

export function useRecurringSuggestions() {
  return useQuery({
    queryKey: billingKeys.suggestions,
    queryFn: () =>
      apiRequest<{ suggestions: RecurringTripSuggestion[] }>("/api/parent/recurring-trip-suggestions"),
    select: (data) => data.suggestions,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: billingKeys.preferences,
    queryFn: () =>
      apiRequest<{ preferences: NotificationPreference[] }>("/api/billing/notification-preferences"),
    select: (data) => data.preferences,
  });
}

export function useViewerInvites(tripId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: billingKeys.viewerInvites(tripId ?? ""),
    queryFn: () => apiRequest<{ invites: ViewerInvite[] }>(`/api/trips/${tripId}/viewer-invites`),
    select: (data) => data.invites,
    enabled: Boolean(tripId) && enabled,
  });
}

export function isEntitled(entitlements: Record<string, boolean | number | null> | undefined, key: string) {
  return entitlements?.[key] === true;
}

export function formatMoney(amountMinor: number, currency: string) {
  const major = amountMinor / 100;
  // "NGN" text, not the "₦" glyph: many Android system fonts render the Naira
  // sign with strokes that visually bleed into the following digits.
  const prefix = currency === "NGN" ? "NGN " : currency === "USD" ? "$" : `${currency} `;
  return `${prefix}${major.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
