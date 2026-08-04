import crypto from "crypto";

import { Receiver } from "@upstash/qstash";

export type CronAuthConfig = {
  nodeEnv: string | undefined;
  cronSecret: string | undefined;
  currentSigningKey: string | undefined;
  nextSigningKey: string | undefined;
};

function runtimeConfig(): CronAuthConfig {
  return {
    nodeEnv: process.env.NODE_ENV,
    cronSecret: process.env.CRON_SECRET,
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  };
}

function secretsMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function hasValidBearer(request: Request, secret: string | undefined) {
  if (!secret) return false;
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  return secretsMatch(authorization.slice("Bearer ".length), secret);
}

async function hasValidQStashSignature(
  request: Request,
  config: CronAuthConfig
) {
  const signature = request.headers.get("upstash-signature");
  if (!signature || !config.currentSigningKey || !config.nextSigningKey) {
    return false;
  }

  try {
    const receiver = new Receiver({
      currentSigningKey: config.currentSigningKey,
      nextSigningKey: config.nextSigningKey,
      devMode: false,
    });
    return await receiver.verify({
      signature,
      body: await request.clone().text(),
      url: request.url,
      upstashRegion: request.headers.get("upstash-region") ?? undefined,
    });
  } catch {
    return false;
  }
}

export async function isCronRequestAuthorized(
  request: Request,
  config: CronAuthConfig = runtimeConfig()
) {
  if (hasValidBearer(request, config.cronSecret)) return true;
  if (await hasValidQStashSignature(request, config)) return true;

  const authenticationConfigured = Boolean(
    config.cronSecret ||
      config.currentSigningKey ||
      config.nextSigningKey
  );
  return config.nodeEnv !== "production" && !authenticationConfigured;
}
