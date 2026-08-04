import assert from "node:assert/strict";
import test from "node:test";

import { parseCsv } from "../../lib/csv";
import { paystackEnvironmentFromSecret } from "../../lib/billing/provider-environment";
import {
  createTripViewerInviteToken,
  hashTripViewerInviteToken,
  viewerInviteExpiry,
} from "../../lib/trip-viewer-invites";

test("Paystack keys resolve to isolated provider environments", () => {
  assert.equal(paystackEnvironmentFromSecret("sk_test_example"), "TEST");
  assert.equal(paystackEnvironmentFromSecret("sk_live_example"), "LIVE");
  assert.equal(paystackEnvironmentFromSecret(""), null);
  assert.throws(() => paystackEnvironmentFromSecret("invalid"), /not a recognized/);
});

test("viewer invitations use opaque tokens and stable hashes", () => {
  const invite = createTripViewerInviteToken();
  assert.notEqual(invite.token, invite.tokenHash);
  assert.equal(hashTripViewerInviteToken(invite.token), invite.tokenHash);
  assert.equal(invite.tokenHash.length, 64);
});

test("viewer invitation expiry is constrained to one through thirty days", () => {
  const now = Date.now();
  const oneDay = viewerInviteExpiry(-10).getTime() - now;
  const thirtyDays = viewerInviteExpiry(90).getTime() - now;
  assert.ok(oneDay >= 24 * 60 * 60 * 1000 - 100);
  assert.ok(oneDay <= 24 * 60 * 60 * 1000 + 100);
  assert.ok(thirtyDays >= 30 * 24 * 60 * 60 * 1000 - 100);
  assert.ok(thirtyDays <= 30 * 24 * 60 * 60 * 1000 + 100);
});

test("school CSV parser supports quoted commas and escaped quotes", () => {
  assert.deepEqual(
    parseCsv('name,email,note\r\n"Ada, Jr",ada@example.test,"said ""hello"""\r\n'),
    [{ name: "Ada, Jr", email: "ada@example.test", note: 'said "hello"' }]
  );
  assert.throws(() => parseCsv("name,email\nonly-a-header-value"), /expected 2/);
});
