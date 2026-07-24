export const PLAN_CODES = {
  FREE_FAMILY: "FREE_FAMILY",
  PRO_FAMILY: "PRO_FAMILY",
  FREE_SCHOOL: "FREE_SCHOOL",
  SCHOOL_PRO: "SCHOOL_PRO",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type PlanCode = (typeof PLAN_CODES)[keyof typeof PLAN_CODES];

export const FEATURE_KEYS = [
  "basic_live_location",
  "pickup_dropoff_status",
  "emergency_alerts",
  "push_notifications",
  "extended_history",
  "eta_alerts",
  "geofences",
  "safety_detection",
  "premium_notifications",
  "recurring_trips",
  "multiple_viewers",
  "downloadable_reports",
  "priority_support",
  "fleet_map",
  "assignments",
  "attendance_automation",
  "analytics",
  "parent_notification_automation",
  "csv_import",
  "csv_export",
  "driver_verification",
  "staff_permissions",
  "multiple_branches",
  "custom_roles",
  "api_access",
  "outbound_webhooks",
  "branding",
  "integrations",
  "advanced_safety_analytics",
  "custom_retention",
  "compliance_exports",
  "dedicated_support",
  "sla",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const LIMIT_KEYS = [
  "max_children",
  "max_connected_drivers",
  "max_viewers",
  "history_hours",
  "max_recurring_trip_templates",
  "premium_messages_per_month",
  "max_buses",
  "max_students",
  "max_staff",
  "max_branches",
] as const;

export type LimitKey = (typeof LIMIT_KEYS)[number];
export type EntitlementValue = boolean | number | null;
export type EntitlementMap = Partial<Record<FeatureKey | LimitKey, EntitlementValue>>;

const ALWAYS_AVAILABLE: EntitlementMap = {
  basic_live_location: true,
  pickup_dropoff_status: true,
  emergency_alerts: true,
  push_notifications: true,
};

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  audience: "FAMILY" | "SCHOOL" | "ENTERPRISE";
  tier: "FREE" | "PRO" | "ENTERPRISE";
  description: string;
  marketingFeatures: string[];
  entitlements: EntitlementMap;
  isPublic: boolean;
  isPurchasable: boolean;
};

export const PLAN_CATALOG: Record<PlanCode, PlanDefinition> = {
  FREE_FAMILY: {
    code: PLAN_CODES.FREE_FAMILY,
    name: "Free Family",
    audience: "FAMILY",
    tier: "FREE",
    description: "Essential live safety for one child and one connected driver.",
    marketingFeatures: [
      "One child",
      "One connected driver",
      "24-hour trip history",
      "Critical safety alerts",
    ],
    entitlements: {
      ...ALWAYS_AVAILABLE,
      max_children: 1,
      max_connected_drivers: 1,
      max_viewers: 0,
      history_hours: 24,
      max_recurring_trip_templates: 0,
      premium_messages_per_month: 0,
    },
    isPublic: true,
    isPurchasable: false,
  },
  PRO_FAMILY: {
    code: PLAN_CODES.PRO_FAMILY,
    name: "Pro Family",
    audience: "FAMILY",
    tier: "PRO",
    description: "Advanced trip automation, family sharing, alerts, and reports.",
    marketingFeatures: [
      "Up to five children and drivers",
      "90-day trip history",
      "Geofences and advanced alerts",
      "Recurring trips and downloadable reports",
    ],
    entitlements: {
      ...ALWAYS_AVAILABLE,
      extended_history: true,
      eta_alerts: true,
      geofences: true,
      safety_detection: true,
      premium_notifications: true,
      recurring_trips: true,
      multiple_viewers: true,
      downloadable_reports: true,
      priority_support: true,
      max_children: 5,
      max_connected_drivers: 5,
      max_viewers: 5,
      history_hours: 24 * 90,
      max_recurring_trip_templates: 10,
      premium_messages_per_month: 100,
    },
    isPublic: true,
    isPurchasable: false,
  },
  FREE_SCHOOL: {
    code: PLAN_CODES.FREE_SCHOOL,
    name: "Free School",
    audience: "SCHOOL",
    tier: "FREE",
    description: "Essential transport operations for a small school.",
    marketingFeatures: [
      "One bus",
      "Up to 30 students",
      "Three operational staff",
      "24-hour trip history",
    ],
    entitlements: {
      ...ALWAYS_AVAILABLE,
      assignments: true,
      max_buses: 1,
      max_students: 30,
      max_staff: 3,
      history_hours: 24,
    },
    isPublic: true,
    isPurchasable: false,
  },
  SCHOOL_PRO: {
    code: PLAN_CODES.SCHOOL_PRO,
    name: "School Pro",
    audience: "SCHOOL",
    tier: "PRO",
    description: "Fleet operations, automation, analytics, and reporting.",
    marketingFeatures: [
      "Up to 25 buses",
      "Up to 1,000 students",
      "Fleet map and attendance automation",
      "Analytics and data export",
    ],
    entitlements: {
      ...ALWAYS_AVAILABLE,
      extended_history: true,
      fleet_map: true,
      assignments: true,
      attendance_automation: true,
      analytics: true,
      parent_notification_automation: true,
      csv_import: true,
      csv_export: true,
      driver_verification: true,
      staff_permissions: true,
      downloadable_reports: true,
      max_buses: 25,
      max_students: 1000,
      max_staff: 100,
      history_hours: 24 * 365,
    },
    isPublic: false,
    isPurchasable: false,
  },
  ENTERPRISE: {
    code: PLAN_CODES.ENTERPRISE,
    name: "Enterprise",
    audience: "ENTERPRISE",
    tier: "ENTERPRISE",
    description: "Contract-defined multi-branch operations and integrations.",
    marketingFeatures: [
      "Contract-defined scale",
      "Custom permissions and retention",
      "API, webhooks, branding, and integrations",
      "Dedicated support and SLA controls",
    ],
    entitlements: {
      ...ALWAYS_AVAILABLE,
      extended_history: true,
      eta_alerts: true,
      geofences: true,
      safety_detection: true,
      premium_notifications: true,
      recurring_trips: true,
      multiple_viewers: true,
      downloadable_reports: true,
      priority_support: true,
      fleet_map: true,
      assignments: true,
      attendance_automation: true,
      analytics: true,
      parent_notification_automation: true,
      csv_import: true,
      csv_export: true,
      driver_verification: true,
      staff_permissions: true,
      multiple_branches: true,
      custom_roles: true,
      api_access: true,
      outbound_webhooks: true,
      branding: true,
      integrations: true,
      advanced_safety_analytics: true,
      custom_retention: true,
      compliance_exports: true,
      dedicated_support: true,
      sla: true,
      max_children: null,
      max_connected_drivers: null,
      max_viewers: null,
      history_hours: null,
      max_recurring_trip_templates: null,
      premium_messages_per_month: null,
      max_buses: null,
      max_students: null,
      max_staff: null,
      max_branches: null,
    },
    isPublic: false,
    isPurchasable: false,
  },
};

const knownKeys = new Set<string>([...FEATURE_KEYS, ...LIMIT_KEYS]);

export function isKnownEntitlementKey(value: string) {
  return knownKeys.has(value);
}

export function normalizeEntitlements(value: unknown): EntitlementMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, item]) =>
        isKnownEntitlementKey(key) &&
        (typeof item === "boolean" || typeof item === "number" || item === null)
    )
  ) as EntitlementMap;
}

export function defaultFreePlanCode(audience: "FAMILY" | "SCHOOL") {
  return audience === "FAMILY" ? PLAN_CODES.FREE_FAMILY : PLAN_CODES.FREE_SCHOOL;
}

export function requiredPlanFor(key: FeatureKey | LimitKey, audience: "FAMILY" | "SCHOOL") {
  if (audience === "FAMILY") return PLAN_CODES.PRO_FAMILY;
  return PLAN_CODES.SCHOOL_PRO;
}
