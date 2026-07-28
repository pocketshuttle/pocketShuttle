import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canInvitePlatformRole,
  hasPlatformPermission,
  PLATFORM_PERMISSIONS,
  ROLE_PERMISSIONS,
  wouldRemoveLastPlatformOwner,
} from "../../lib/admin/permissions";
import {
  createAdminInviteToken,
  hashAdminInviteToken,
  normalizeAdminEmail,
  platformAdminInviteAcceptanceState,
  sanitizeAuditValue,
} from "../../lib/admin/request-security";

describe("platform admin permissions", () => {
  it("gives owners every code-defined permission", () => {
    for (const permission of PLATFORM_PERMISSIONS) {
      assert.equal(hasPlatformPermission("OWNER", permission), true);
    }
  });

  it("allows admins to invite non-owners but not owners", () => {
    assert.equal(canInvitePlatformRole("ADMIN", "ADMIN"), true);
    assert.equal(canInvitePlatformRole("ADMIN", "SUPPORT"), true);
    assert.equal(canInvitePlatformRole("ADMIN", "OWNER"), false);
    assert.equal(canInvitePlatformRole("OWNER", "OWNER"), true);
  });

  it("keeps support, billing, and read-only permissions separated", () => {
    assert.equal(hasPlatformPermission("SUPPORT", "support.manage"), true);
    assert.equal(hasPlatformPermission("SUPPORT", "billing.manage"), false);
    assert.equal(hasPlatformPermission("BILLING", "billing.manage"), true);
    assert.equal(hasPlatformPermission("BILLING", "accounts.manage"), false);
    assert.equal(hasPlatformPermission("READ_ONLY", "accounts.read"), true);
    assert.equal(hasPlatformPermission("READ_ONLY", "accounts.manage"), false);
  });

  it("keeps every role permission set inside the code-defined contract", () => {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      for (const permission of permissions) {
        assert.equal(
          PLATFORM_PERMISSIONS.includes(permission),
          true,
          `${role} contains an unknown permission`
        );
      }
    }
    assert.equal(hasPlatformPermission("ADMIN", "admins.manage_owner"), false);
    assert.equal(hasPlatformPermission("SUPPORT", "billing.manage"), false);
    assert.equal(hasPlatformPermission("BILLING", "verification.manage"), false);
    assert.equal(hasPlatformPermission("READ_ONLY", "operations.manage"), false);
  });

  it("protects the final active owner", () => {
    assert.equal(
      wouldRemoveLastPlatformOwner({
        targetRole: "OWNER",
        nextRole: "ADMIN",
        nextStatus: "ACTIVE",
        activeOwnerCount: 1,
      }),
      true
    );
    assert.equal(
      wouldRemoveLastPlatformOwner({
        targetRole: "OWNER",
        nextRole: "ADMIN",
        nextStatus: "ACTIVE",
        activeOwnerCount: 2,
      }),
      false
    );
  });
});

describe("platform admin invitation security", () => {
  it("normalizes email and stores only a deterministic token hash", () => {
    assert.equal(normalizeAdminEmail("  Owner@Example.COM "), "owner@example.com");
    assert.equal(normalizeAdminEmail("OWNER@example.com"), "owner@example.com");
    const invite = createAdminInviteToken();
    assert.notEqual(invite.token, invite.tokenHash);
    assert.equal(hashAdminInviteToken(invite.token), invite.tokenHash);
  });

  it("redacts secrets from nested audit metadata", () => {
    assert.deepEqual(
      sanitizeAuditValue({
        email: "admin@example.com",
        password: "secret",
        nested: { tokenHash: "hidden", status: "ACTIVE" },
      }),
      {
        email: "admin@example.com",
        nested: { status: "ACTIVE" },
      }
    );
  });

  it("rejects expired, accepted, and revoked invitations", () => {
    const now = new Date("2026-07-24T12:00:00.000Z");
    assert.equal(
      platformAdminInviteAcceptanceState({
        status: "PENDING",
        expiresAt: new Date("2026-07-24T12:00:01.000Z"),
        now,
      }),
      "ACCEPTABLE"
    );
    assert.equal(
      platformAdminInviteAcceptanceState({
        status: "PENDING",
        expiresAt: now,
        now,
      }),
      "EXPIRED"
    );
    for (const status of ["ACCEPTED", "REVOKED", "EXPIRED"] as const) {
      assert.equal(
        platformAdminInviteAcceptanceState({
          status,
          expiresAt: new Date("2026-07-25T12:00:00.000Z"),
          now,
        }),
        "UNAVAILABLE"
      );
    }
  });
});
