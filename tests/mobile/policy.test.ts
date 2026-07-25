import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createMobileRefreshToken,
  hashMobileToken,
  MOBILE_ACCESS_TTL_SECONDS,
  MOBILE_REFRESH_TTL_MS,
  mobileRefreshExpiresAt,
  normalizeMobileRole,
  shouldTrackDriverLocation,
} from "../../lib/mobile/policy";

describe("mobile authentication policy", () => {
  it("accepts only customer mobile roles", () => {
    assert.equal(normalizeMobileRole(" Parent "), "parent");
    assert.equal(normalizeMobileRole("DRIVER"), "driver");
    assert.equal(normalizeMobileRole("teacher"), "teacher");
    assert.equal(normalizeMobileRole("admin"), null);
    assert.equal(normalizeMobileRole("school"), null);
  });

  it("creates opaque refresh tokens and deterministic hashes", () => {
    const first = createMobileRefreshToken();
    const second = createMobileRefreshToken();
    assert.notEqual(first.token, first.tokenHash);
    assert.notEqual(first.token, second.token);
    assert.equal(hashMobileToken(first.token), first.tokenHash);
  });

  it("uses short access and thirty-day refresh windows", () => {
    const now = Date.parse("2026-07-25T00:00:00.000Z");
    assert.equal(MOBILE_ACCESS_TTL_SECONDS, 15 * 60);
    assert.equal(
      mobileRefreshExpiresAt(now).getTime() - now,
      MOBILE_REFRESH_TTL_MS
    );
  });
});

describe("driver background tracking policy", () => {
  it("tracks only an active driver session with permission", () => {
    assert.equal(
      shouldTrackDriverLocation({
        role: "driver",
        tripStatus: "active",
        permissionGranted: true,
        sessionActive: true,
      }),
      true
    );
    for (const input of [
      {
        role: "parent" as const,
        tripStatus: "active",
        permissionGranted: true,
        sessionActive: true,
      },
      {
        role: "driver" as const,
        tripStatus: "completed",
        permissionGranted: true,
        sessionActive: true,
      },
      {
        role: "driver" as const,
        tripStatus: "active",
        permissionGranted: false,
        sessionActive: true,
      },
      {
        role: "driver" as const,
        tripStatus: "active",
        permissionGranted: true,
        sessionActive: false,
      },
    ]) {
      assert.equal(shouldTrackDriverLocation(input), false);
    }
  });

  it("continues location collection while paused or in emergency", () => {
    for (const tripStatus of ["paused", "emergency"]) {
      assert.equal(
        shouldTrackDriverLocation({
          role: "driver",
          tripStatus,
          permissionGranted: true,
          sessionActive: true,
        }),
        true
      );
    }
  });
});
