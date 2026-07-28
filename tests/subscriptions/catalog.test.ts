import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURE_KEYS,
  PLAN_CATALOG,
  PLAN_CODES,
  defaultFreePlanCode,
  normalizeEntitlements,
} from "../../lib/billing/catalog";

test("critical safety features remain enabled on every catalog plan", () => {
  for (const plan of Object.values(PLAN_CATALOG)) {
    assert.equal(plan.entitlements.basic_live_location, true, plan.code);
    assert.equal(plan.entitlements.pickup_dropoff_status, true, plan.code);
    assert.equal(plan.entitlements.emergency_alerts, true, plan.code);
    assert.equal(plan.entitlements.push_notifications, true, plan.code);
  }
});

test("family limits match the tier contract", () => {
  const free = PLAN_CATALOG.FREE_FAMILY.entitlements;
  const pro = PLAN_CATALOG.PRO_FAMILY.entitlements;
  assert.equal(free.max_children, 1);
  assert.equal(free.max_connected_drivers, 1);
  assert.equal(free.history_hours, 24);
  assert.equal(pro.max_children, 5);
  assert.equal(pro.max_connected_drivers, 5);
  assert.equal(pro.max_viewers, 5);
  assert.equal(pro.history_hours, 24 * 90);
  assert.equal(pro.premium_messages_per_month, 100);
});

test("school limits match the tier contract", () => {
  const free = PLAN_CATALOG.FREE_SCHOOL.entitlements;
  const pro = PLAN_CATALOG.SCHOOL_PRO.entitlements;
  assert.deepEqual(
    [free.max_buses, free.max_students, free.max_staff, free.history_hours],
    [1, 30, 3, 24]
  );
  assert.deepEqual(
    [pro.max_buses, pro.max_students, pro.max_staff, pro.history_hours],
    [25, 1000, 100, 24 * 365]
  );
});

test("enterprise resource limits are contract-overridable and unlimited by default", () => {
  const enterprise = PLAN_CATALOG.ENTERPRISE.entitlements;
  assert.equal(enterprise.max_buses, null);
  assert.equal(enterprise.max_students, null);
  assert.equal(enterprise.max_staff, null);
  assert.equal(enterprise.history_hours, null);
});

test("unknown entitlement keys are removed", () => {
  const normalized = normalizeEntitlements({
    fleet_map: true,
    max_buses: 25,
    invented_feature: true,
    max_students: "unlimited",
  });
  assert.deepEqual(normalized, { fleet_map: true, max_buses: 25 });
  assert.ok(FEATURE_KEYS.includes("fleet_map"));
});

test("free fallback is audience-specific", () => {
  assert.equal(defaultFreePlanCode("FAMILY"), PLAN_CODES.FREE_FAMILY);
  assert.equal(defaultFreePlanCode("SCHOOL"), PLAN_CODES.FREE_SCHOOL);
});
