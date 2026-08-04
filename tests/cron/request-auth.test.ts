import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";

import { SignJWT } from "jose";

import {
  CronAuthConfig,
  isCronRequestAuthorized,
} from "../../lib/cron/request-auth";

const productionConfig: CronAuthConfig = {
  nodeEnv: "production",
  cronSecret: "manual-recovery-secret",
  currentSigningKey: "current-qstash-signing-key",
  nextSigningKey: "next-qstash-signing-key",
};

async function qstashSignature(url: string, body: string, key: string) {
  const bodyHash = crypto
    .createHash("sha256")
    .update(body)
    .digest("base64url");
  return new SignJWT({ body: bodyHash })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("Upstash")
    .setSubject(url)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(key));
}

describe("cron request authentication", () => {
  it("accepts the manual recovery bearer secret", async () => {
    const request = new Request("https://staging.example.test/api/cron", {
      headers: { authorization: "Bearer manual-recovery-secret" },
    });
    assert.equal(
      await isCronRequestAuthorized(request, productionConfig),
      true
    );
  });

  it("accepts QStash signatures made with current or next signing keys", async () => {
    const url = "https://staging.example.test/api/cron";
    for (const key of [
      productionConfig.currentSigningKey,
      productionConfig.nextSigningKey,
    ]) {
      const signature = await qstashSignature(url, "", String(key));
      const request = new Request(url, {
        headers: { "upstash-signature": signature },
      });
      assert.equal(
        await isCronRequestAuthorized(request, productionConfig),
        true
      );
    }
  });

  it("rejects invalid signatures, wrong bearer secrets, and unsigned production calls", async () => {
    const url = "https://staging.example.test/api/cron";
    const wrongSignature = await qstashSignature(url, "", "wrong-key");
    const requests = [
      new Request(url),
      new Request(url, { headers: { authorization: "Bearer wrong" } }),
      new Request(url, {
        headers: { "upstash-signature": wrongSignature },
      }),
    ];

    for (const request of requests) {
      assert.equal(
        await isCronRequestAuthorized(request, productionConfig),
        false
      );
    }
  });

  it("allows unconfigured local development but fails closed once authentication is configured", async () => {
    const request = new Request("http://localhost:3000/api/cron");
    assert.equal(
      await isCronRequestAuthorized(request, {
        nodeEnv: "development",
        cronSecret: undefined,
        currentSigningKey: undefined,
        nextSigningKey: undefined,
      }),
      true
    );
    assert.equal(
      await isCronRequestAuthorized(request, {
        nodeEnv: "development",
        cronSecret: "configured",
        currentSigningKey: undefined,
        nextSigningKey: undefined,
      }),
      false
    );
    assert.equal(
      await isCronRequestAuthorized(request, {
        nodeEnv: "production",
        cronSecret: undefined,
        currentSigningKey: undefined,
        nextSigningKey: undefined,
      }),
      false
    );
  });
});
