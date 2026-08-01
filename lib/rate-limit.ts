import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logger";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

let warnedMissingRedis = false;
const limiters = new Map<string, Ratelimit>();
const memoryWindows = new Map<string, { count: number; resetAt: number }>();

function getLimiter(limit: number, windowMs: number) {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: "dropoff-ratelimit",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

function assertMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = memoryWindows.get(key);
  if (!current || current.resetAt <= now) {
    memoryWindows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new Error("RATE_LIMITED");
  }
  current.count += 1;
}

/**
 * Rate-limits by key using a shared Upstash Redis store so limits hold across
 * serverless instances. Falls back to an in-memory window (per-instance only,
 * not safe once running more than one instance) when Redis isn't configured.
 */
export async function assertRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
) {
  if (!redis) {
    if (!warnedMissingRedis) {
      warnedMissingRedis = true;
      logger.warn(
        "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not configured — falling back to in-memory rate limiting. This does not work across multiple server instances; set Upstash Redis credentials before scaling past a single instance."
      );
    }
    assertMemoryRateLimit(key, options.limit, options.windowMs);
    return;
  }

  const { success } = await getLimiter(options.limit, options.windowMs).limit(key);
  if (!success) {
    throw new Error("RATE_LIMITED");
  }
}
