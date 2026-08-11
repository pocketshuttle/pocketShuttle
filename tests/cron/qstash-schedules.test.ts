import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasFutureNextRun,
  loadQStashConfig,
  qstashDestination,
  qstashScheduleId,
  QSTASH_SCHEDULES,
} from "../../scripts/qstash-schedules";

describe("QStash schedule definitions", () => {
  it("defines the seven UTC schedules with safe retry policies", () => {
    assert.deepEqual(
      QSTASH_SCHEDULES.map(({ name, cron, retries }) => ({
        name,
        cron,
        retries,
      })),
      [
        { name: "reset-student", cron: "45 2 * * *", retries: 3 },
        { name: "reset-status", cron: "0 9 * * *", retries: 3 },
        { name: "subscriptions", cron: "15 * * * *", retries: 0 },
        { name: "trip-templates", cron: "*/15 * * * *", retries: 0 },
        { name: "recurring-trip-suggestions", cron: "0 6 * * *", retries: 0 },
        { name: "outbound-webhooks", cron: "*/5 * * * *", retries: 0 },
        { name: "support-retention", cron: "20 3 * * *", retries: 3 },
      ]
    );
  });

  it("builds stable environment-scoped IDs and HTTPS destinations", () => {
    assert.equal(
      qstashScheduleId("pocketshuttle-staging", "subscriptions"),
      "pocketshuttle-staging-subscriptions"
    );
    assert.equal(
      qstashDestination(
        new URL("https://staging.example.test/base"),
        "/api/cron-jobs/subscriptions"
      ),
      "https://staging.example.test/api/cron-jobs/subscriptions"
    );
  });

  it("requires complete operator configuration and an HTTPS destination", () => {
    assert.throws(() => loadQStashConfig({}), /QSTASH_TOKEN is required/);
    assert.throws(
      () =>
        loadQStashConfig({
          QSTASH_TOKEN: "token",
          QSTASH_DESTINATION_BASE_URL: "http://localhost:3000",
          QSTASH_SCHEDULE_PREFIX: "pocketshuttle-local",
        }),
      /must use https/
    );
    assert.throws(
      () =>
        loadQStashConfig({
          QSTASH_TOKEN: "token",
          QSTASH_DESTINATION_BASE_URL: "https://staging.example.test",
          QSTASH_SCHEDULE_PREFIX: "invalid prefix",
        }),
      /may contain only/
    );
  });

  it("requires a future next-run timestamp during remote verification", () => {
    const now = Date.UTC(2026, 6, 27, 12);
    assert.equal(hasFutureNextRun({ nextScheduleTime: now + 60_000 }, now), true);
    assert.equal(hasFutureNextRun({ nextScheduleTime: now }, now), false);
    assert.equal(hasFutureNextRun({}, now), false);
  });
});
