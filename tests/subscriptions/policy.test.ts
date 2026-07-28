import assert from "node:assert/strict";
import test from "node:test";

import {
  connectionConsumesDriverSlot,
  defaultBillingEnforcement,
  driverSlotIncrement,
  historyCutoffForHours,
  isUsableSubscription,
  limitAllows,
} from "../../lib/billing/policy";

const now = new Date("2026-07-23T12:00:00.000Z");

test("resource limits allow the boundary and block the first excess record", () => {
  assert.equal(limitAllows(1, 0), true);
  assert.equal(limitAllows(1, 1), false);
  assert.equal(limitAllows(5, 3, 2), true);
  assert.equal(limitAllows(5, 4, 2), false);
  assert.equal(limitAllows(null, 1_000_000), true);
  assert.equal(limitAllows(undefined, 0), false);
});

test("family enforcement defaults on without changing the school rollout", () => {
  assert.equal(defaultBillingEnforcement("FAMILY"), true);
  assert.equal(defaultBillingEnforcement("ORGANIZATION"), true);
  assert.equal(defaultBillingEnforcement("SCHOOL"), false);
});

test("pending and approved driver connections consume a plan slot", () => {
  for (const status of ["INVITED", "DRIVER_REQUESTED", "PARENT_APPROVED"]) {
    assert.equal(connectionConsumesDriverSlot(status), true);
    assert.equal(driverSlotIncrement(status), 0);
  }
  for (const status of ["DECLINED", "REVOKED", null]) {
    assert.equal(connectionConsumesDriverSlot(status), false);
    assert.equal(driverSlotIncrement(status), 1);
  }
});

test("subscription lifecycle honors active periods and past-due grace", () => {
  const future = new Date("2026-07-24T12:00:00.000Z");
  const past = new Date("2026-07-22T12:00:00.000Z");
  assert.equal(isUsableSubscription("ACTIVE", future, null, now), true);
  assert.equal(isUsableSubscription("ACTIVE", past, null, now), false);
  assert.equal(isUsableSubscription("PAST_DUE", future, future, now), true);
  assert.equal(isUsableSubscription("PAST_DUE", future, past, now), false);
  assert.equal(isUsableSubscription("NON_RENEWING", future, null, now), true);
  assert.equal(isUsableSubscription("CANCELLED", future, null, now), false);
});

test("history windows are calculated independently from storage retention", () => {
  assert.equal(
    historyCutoffForHours(24, now)?.toISOString(),
    "2026-07-22T12:00:00.000Z"
  );
  assert.equal(
    historyCutoffForHours(24 * 90, now)?.toISOString(),
    "2026-04-24T12:00:00.000Z"
  );
  assert.equal(historyCutoffForHours(null, now), null);
});
