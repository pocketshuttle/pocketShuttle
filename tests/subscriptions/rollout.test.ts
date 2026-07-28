import assert from "node:assert/strict";
import test from "node:test";

import {
  BILLING_ROLLOUT_FLAGS,
  hasBillingRolloutFlag,
} from "../../lib/billing/rollout";

test("paid checkout is denied unless the account is explicitly enrolled", () => {
  assert.equal(
    hasBillingRolloutFlag({}, BILLING_ROLLOUT_FLAGS.PAID_CHECKOUT),
    false
  );
  assert.equal(
    hasBillingRolloutFlag(null, BILLING_ROLLOUT_FLAGS.PAID_CHECKOUT),
    false
  );
  assert.equal(
    hasBillingRolloutFlag(
      { paidCheckout: false },
      BILLING_ROLLOUT_FLAGS.PAID_CHECKOUT
    ),
    false
  );
});

test("paid checkout is enabled only by the explicit boolean flag", () => {
  assert.equal(
    hasBillingRolloutFlag(
      { paidCheckout: true },
      BILLING_ROLLOUT_FLAGS.PAID_CHECKOUT
    ),
    true
  );
  assert.equal(
    hasBillingRolloutFlag(
      { paidCheckout: "true" },
      BILLING_ROLLOUT_FLAGS.PAID_CHECKOUT
    ),
    false
  );
});
