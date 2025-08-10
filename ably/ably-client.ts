import Ably from "ably";

let client: Ably.Realtime | null = null;

export function getAblyClient() {
  if (!client) {
    client = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_KEY! });
  }
  return client;
}
