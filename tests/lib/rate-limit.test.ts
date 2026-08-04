import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertRateLimit } from "../../lib/rate-limit";

// No UPSTASH_REDIS_REST_URL/TOKEN are set in the test environment, so these
// exercise the in-memory fallback path.

describe("assertRateLimit (in-memory fallback)", () => {
  it("allows requests under the limit", async () => {
    const key = `test:${Math.random()}`;
    await assertRateLimit(key, { limit: 3, windowMs: 1000 });
    await assertRateLimit(key, { limit: 3, windowMs: 1000 });
    await assertRateLimit(key, { limit: 3, windowMs: 1000 });
  });

  it("throws once the limit is exceeded within the window", async () => {
    const key = `test:${Math.random()}`;
    await assertRateLimit(key, { limit: 2, windowMs: 1000 });
    await assertRateLimit(key, { limit: 2, windowMs: 1000 });

    await assert.rejects(
      () => assertRateLimit(key, { limit: 2, windowMs: 1000 }),
      /RATE_LIMITED/
    );
  });

  it("resets the count once the window elapses", async () => {
    const key = `test:${Math.random()}`;
    await assertRateLimit(key, { limit: 1, windowMs: 50 });
    await assert.rejects(() => assertRateLimit(key, { limit: 1, windowMs: 50 }));

    await new Promise((resolve) => setTimeout(resolve, 60));
    await assertRateLimit(key, { limit: 1, windowMs: 50 });
  });

  it("tracks separate keys independently", async () => {
    const keyA = `test:a:${Math.random()}`;
    const keyB = `test:b:${Math.random()}`;
    await assertRateLimit(keyA, { limit: 1, windowMs: 1000 });
    await assertRateLimit(keyB, { limit: 1, windowMs: 1000 });
    await assert.rejects(() => assertRateLimit(keyA, { limit: 1, windowMs: 1000 }));
  });
});
