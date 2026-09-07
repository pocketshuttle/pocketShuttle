import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { apiRequest } from "../api/client";
import type {
  Connection,
  DriverInvite,
  DriverSearchResult,
  KnownDriverEvent,
  ParentChild,
} from "../types";

export const queryKeys = {
  dashboard: ["mobile-dashboard"] as const,
  parentConnections: ["parent-connections"] as const,
  driverConnections: ["driver-connections"] as const,
  driverInvites: ["driver-invites"] as const,
  parentChildren: ["parent-children"] as const,
  knownDriverEvents: ["known-driver-events"] as const,
};

export function connectionsKey(role: "parent" | "driver") {
  return role === "parent" ? queryKeys.parentConnections : queryKeys.driverConnections;
}

export function useConnections(role: "parent" | "driver") {
  return useQuery({
    queryKey: connectionsKey(role),
    queryFn: () =>
      apiRequest<{ connections: Connection[] }>("/api/parent-driver-connections"),
    select: (data) => data.connections,
    refetchInterval: 15_000,
  });
}

export function useDriverInvites() {
  return useQuery({
    queryKey: queryKeys.driverInvites,
    queryFn: () => apiRequest<{ invites: DriverInvite[] }>("/api/drivers/invites"),
    select: (data) => data.invites,
    refetchInterval: 30_000,
  });
}

export function useParentChildren() {
  return useQuery({
    queryKey: queryKeys.parentChildren,
    queryFn: () => apiRequest<{ children: ParentChild[] }>("/api/parent/children"),
    select: (data) => data.children,
  });
}

export function useKnownDriverEvents() {
  return useQuery({
    queryKey: queryKeys.knownDriverEvents,
    queryFn: () => apiRequest<{ events: KnownDriverEvent[] }>("/api/known-driver-events"),
    select: (data) => data.events,
    refetchInterval: 20_000,
  });
}

export function useDriverSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["driver-search", trimmed],
    queryFn: () =>
      apiRequest<{ drivers: DriverSearchResult[] }>(
        `/api/drivers/search?query=${encodeURIComponent(trimmed)}`
      ),
    select: (data) => data.drivers,
    enabled: trimmed.length >= 2,
  });
}

export function useDebouncedValue<T>(value: T, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
