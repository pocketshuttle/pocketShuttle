import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "../auth/context";
import { subscribeToKnownDriverChannel } from "../services/realtime";
import { connectionsKey, queryKeys } from "./marketplace";

const KNOWN_DRIVER_EVENTS = new Set([
  "child-driver-event",
  "connection-updated",
  "connection-approved",
  "connection-revoked",
  "assignments-updated",
  "driver-location-updated",
]);

export function useKnownDriverRealtime(role: "parent" | "driver") {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!actor || actor.role !== role) return;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    subscribeToKnownDriverChannel(role, actor.id, (event) => {
      if (!KNOWN_DRIVER_EVENTS.has(event.name)) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.knownDriverEvents });
      void queryClient.invalidateQueries({ queryKey: connectionsKey(role) });
      if (role === "parent" && event.name !== "driver-location-updated") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.driverInvites });
      }
    })
      .then((fn) => {
        if (cancelled) fn();
        else unsubscribe = fn;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [actor, role, queryClient]);
}

export function KnownDriverRealtime({ role }: { role: "parent" | "driver" }) {
  useKnownDriverRealtime(role);
  return null;
}
