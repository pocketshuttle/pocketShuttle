import {
  Pusher,
  PusherEvent,
} from "@pusher/pusher-websocket-react-native";

import { apiRequest } from "../api/client";

const pusher = Pusher.getInstance();
let ready = false;

async function ensurePusher() {
  const apiKey = process.env.EXPO_PUBLIC_PUSHER_KEY;
  const cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;
  if (!apiKey || !cluster) return false;
  if (!ready) {
    await pusher.init({
      apiKey,
      cluster,
      onAuthorizer: async (channelName, socketId) =>
        apiRequest<Record<string, string>>("/api/mobile/realtime/auth", {
          method: "POST",
          body: JSON.stringify({ channelName, socketId }),
        }),
    });
    await pusher.connect();
    ready = true;
  }
  return true;
}

export type RealtimeEvent = { name: string; data: unknown };

async function subscribeToChannel(
  channelName: string,
  onEvent: (event: RealtimeEvent) => void
) {
  if (!(await ensurePusher())) return () => undefined;
  await pusher.subscribe({
    channelName,
    onEvent: (event: PusherEvent) => {
      let data: unknown = event.data;
      try {
        data = JSON.parse(event.data);
      } catch {
        // Pusher may already provide a primitive payload.
      }
      onEvent({ name: event.eventName, data });
    },
  });
  return () => {
    void pusher.unsubscribe({ channelName });
  };
}

export function subscribeToTrip(
  tripId: string,
  onEvent: (event: RealtimeEvent) => void
) {
  return subscribeToChannel(`private-trip-${tripId}`, onEvent);
}

/** Known-driver network channel: connection, assignment, child status and driver location events. */
export function subscribeToKnownDriverChannel(
  role: "parent" | "driver",
  id: string,
  onEvent: (event: RealtimeEvent) => void
) {
  return subscribeToChannel(`private-known-driver-${role}-${id}`, onEvent);
}
