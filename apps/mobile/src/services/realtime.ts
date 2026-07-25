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

export async function subscribeToTrip(
  tripId: string,
  onEvent: (event: { name: string; data: unknown }) => void
) {
  if (!(await ensurePusher())) return () => undefined;
  const channelName = `private-trip-${tripId}`;
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
