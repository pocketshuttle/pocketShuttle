import * as Crypto from "expo-crypto";
import Storage from "expo-sqlite/kv-store";

import { ApiError, apiRequest } from "../api/client";

const QUEUE_KEY = "pocketshuttle.mobile.offline-queue";

export type QueuedMobileEvent = {
  id: string;
  path: string;
  method: "POST" | "PATCH";
  body: Record<string, unknown>;
  createdAt: string;
};

async function readQueue(): Promise<QueuedMobileEvent[]> {
  const raw = await Storage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedMobileEvent[]) {
  await Storage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-500)));
}

export async function enqueueMobileEvent(
  event: Omit<QueuedMobileEvent, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
) {
  const queue = await readQueue();
  const next: QueuedMobileEvent = {
    ...event,
    id: event.id || Crypto.randomUUID(),
    createdAt: event.createdAt || new Date().toISOString(),
  };
  if (!queue.some((item) => item.id === next.id)) queue.push(next);
  await writeQueue(queue);
  return next;
}

const STALE_DROPOFF_MS = 10 * 60 * 1000;

function isStaleDropoff(event: QueuedMobileEvent) {
  return (
    event.body.action === "dropped_off" &&
    Date.now() - new Date(event.createdAt).getTime() > STALE_DROPOFF_MS
  );
}

export async function flushMobileEventQueue() {
  const queue = (await readQueue()).sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  );
  const remaining: QueuedMobileEvent[] = [];
  for (const event of queue) {
    if (isStaleDropoff(event)) continue;
    try {
      await apiRequest(event.path, {
        method: event.method,
        body: JSON.stringify({
          ...event.body,
          clientEventId: event.id,
        }),
      });
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        error.status >= 500 ||
        error.status === 429
      ) {
        remaining.push(event);
      }
    }
  }
  await writeQueue(remaining);
  return { sent: queue.length - remaining.length, remaining: remaining.length };
}

function isRetryableError(error: unknown) {
  return !(error instanceof ApiError) || error.status >= 500 || error.status === 429;
}

export async function sendOrQueueMobileEvent<T = unknown>(
  event: Omit<QueuedMobileEvent, "id" | "createdAt"> & { id?: string },
  options: { queueOnlyWhenOffline?: boolean } = {}
): Promise<{
  queued: QueuedMobileEvent | null;
  sent: number;
  remaining: number;
  value: T | null;
}> {
  if (options.queueOnlyWhenOffline) {
    const id = event.id || Crypto.randomUUID();
    try {
      const value = await apiRequest<T>(event.path, {
        method: event.method,
        body: JSON.stringify({ ...event.body, clientEventId: id }),
      });
      return { queued: null, sent: 1, remaining: (await readQueue()).length, value };
    } catch (error) {
      // Validation errors (4xx) must reach the caller; only network/5xx/429 get queued.
      if (!isRetryableError(error)) throw error;
      const queued = await enqueueMobileEvent({ ...event, id });
      return { queued, sent: 0, remaining: (await readQueue()).length, value: null };
    }
  }
  const queued = await enqueueMobileEvent(event);
  const result = await flushMobileEventQueue();
  return { queued, ...result, value: null };
}

export async function queuedMobileEventCount() {
  return (await readQueue()).length;
}
