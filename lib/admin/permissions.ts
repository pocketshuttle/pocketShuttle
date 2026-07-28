export const PLATFORM_ADMIN_ROLES = [
  "OWNER",
  "ADMIN",
  "SUPPORT",
  "BILLING",
  "READ_ONLY",
] as const;

export type PlatformAdminAccessRole = (typeof PLATFORM_ADMIN_ROLES)[number];

export const PLATFORM_PERMISSIONS = [
  "overview.read",
  "accounts.read",
  "accounts.manage",
  "accounts.suspend",
  "workspace.read",
  "workspace.manage",
  "operations.read",
  "operations.manage",
  "safety.read",
  "safety.manage",
  "billing.read",
  "billing.manage",
  "plans.manage",
  "support.manage",
  "verification.manage",
  "notifications.manage",
  "enterprise.manage",
  "admins.read",
  "admins.invite",
  "admins.manage",
  "admins.manage_owner",
  "reports.read",
  "reports.export",
  "audit.read",
] as const;

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

const allPermissions = new Set<PlatformPermission>(PLATFORM_PERMISSIONS);

export const ROLE_PERMISSIONS: Record<
  PlatformAdminAccessRole,
  ReadonlySet<PlatformPermission>
> = {
  OWNER: allPermissions,
  ADMIN: new Set(
    PLATFORM_PERMISSIONS.filter(
      (permission) => permission !== "admins.manage_owner"
    )
  ),
  SUPPORT: new Set([
    "overview.read",
    "accounts.read",
    "workspace.read",
    "operations.read",
    "safety.read",
    "support.manage",
    "verification.manage",
    "admins.read",
    "reports.read",
    "audit.read",
  ]),
  BILLING: new Set([
    "overview.read",
    "accounts.read",
    "billing.read",
    "billing.manage",
    "plans.manage",
    "admins.read",
    "reports.read",
    "reports.export",
    "audit.read",
  ]),
  READ_ONLY: new Set([
    "overview.read",
    "accounts.read",
    "workspace.read",
    "operations.read",
    "safety.read",
    "billing.read",
    "admins.read",
    "reports.read",
    "audit.read",
  ]),
};

export function isPlatformAdminRole(
  value: unknown
): value is PlatformAdminAccessRole {
  return (
    typeof value === "string" &&
    PLATFORM_ADMIN_ROLES.includes(value as PlatformAdminAccessRole)
  );
}

export function hasPlatformPermission(
  role: PlatformAdminAccessRole,
  permission: PlatformPermission
) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function canInvitePlatformRole(
  actorRole: PlatformAdminAccessRole,
  invitedRole: PlatformAdminAccessRole
) {
  if (!hasPlatformPermission(actorRole, "admins.invite")) return false;
  return invitedRole !== "OWNER" || actorRole === "OWNER";
}

export function isPlatformAdminV2Enabled() {
  return process.env.PLATFORM_ADMIN_V2 !== "false";
}

export function wouldRemoveLastPlatformOwner(input: {
  targetRole: PlatformAdminAccessRole;
  nextRole: PlatformAdminAccessRole;
  nextStatus: "ACTIVE" | "DISABLED";
  activeOwnerCount: number;
}) {
  return (
    input.targetRole === "OWNER" &&
    (input.nextRole !== "OWNER" || input.nextStatus === "DISABLED") &&
    input.activeOwnerCount <= 1
  );
}
