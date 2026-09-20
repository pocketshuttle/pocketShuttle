import { useEffect, useState } from "react";

import { useAuth } from "../auth/context";
import { lastSeenKey } from "../lib/known-driver-events";
import { getJson } from "../services/kv";
import { useKnownDriverEvents } from "./marketplace";

/** Count of known-driver events newer than the alerts screen's last-seen stamp, for a Home bell badge. */
export function useUnreadAlertsCount(role: "parent" | "driver") {
  const { actor } = useAuth();
  const events = useKnownDriverEvents();
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;
    void getJson<string | null>(lastSeenKey(role, actor.id), null).then(setLastSeen);
  }, [actor, role]);

  if (!events.data?.length) return 0;
  if (!lastSeen) return events.data.length;
  const cutoff = new Date(lastSeen).getTime();
  return events.data.filter((event) => new Date(event.createdAt).getTime() > cutoff).length;
}
