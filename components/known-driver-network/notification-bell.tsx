"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Loader2, MapPin, Navigation } from "lucide-react";

import { pusherClient } from "@/pusher/client";

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: init?.cache ?? "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}

type EventType = "ON_THE_WAY_TO_SCHOOL" | "PICKED_UP" | "DROPPED_OFF" | "LOCATION_UPDATED" | "LOCATION_REQUESTED" | "ALERT_SENT";

type DriverEvent = {
  id: string;
  assignmentId: string;
  eventType: EventType;
  actorType: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | Date;
  driver: { id: string; full_name: string };
  parent: { id: string; full_name: string | null };
  child: { id: string; fullName: string };
};

type Role = "parent" | "driver";

function eventMessage(event: DriverEvent, role: Role) {
  const driverName = event.driver.full_name;
  const parentName = event.parent.full_name || "The parent";
  const childName = event.child.fullName;

  if (role === "parent") {
    switch (event.eventType) {
      case "LOCATION_UPDATED":
        return `${driverName} shared their live location for ${childName}.`;
      case "LOCATION_REQUESTED":
        return `You requested ${driverName}'s live location for ${childName}.`;
      case "PICKED_UP":
        return `${childName} was picked up by ${driverName}.`;
      case "DROPPED_OFF":
        return `${childName} was dropped off by ${driverName}.`;
      case "ON_THE_WAY_TO_SCHOOL":
        return `${driverName} is on the way with ${childName}.`;
      case "ALERT_SENT":
        return `An alert was sent for ${childName}'s trip with ${driverName}.`;
      default:
        return `${driverName} sent an update for ${childName}.`;
    }
  }

  switch (event.eventType) {
    case "LOCATION_REQUESTED":
      return `${parentName} requested your live location for ${childName}.`;
    case "LOCATION_UPDATED":
      return `You shared your live location for ${childName}.`;
    case "PICKED_UP":
      return `You marked ${childName} as picked up.`;
    case "DROPPED_OFF":
      return `You marked ${childName} as dropped off.`;
    case "ON_THE_WAY_TO_SCHOOL":
      return `You marked ${childName} as on the way to school.`;
    case "ALERT_SENT":
      return `An alert was sent for ${childName}'s trip.`;
    default:
      return `Update for ${childName}.`;
  }
}

function formatRelativeTime(value: string | Date) {
  const time = new Date(value).getTime();
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function KnownDriverNotificationBell({ role, id }: { role: Role; id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<DriverEvent[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [clearedBefore, setClearedBefore] = useState<number>(0);
  const [panelPosition, setPanelPosition] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const lastSeenKey = `known-driver-notifications:last-seen:${role}:${id}`;
  const clearedKey = `known-driver-notifications:cleared-before:${role}:${id}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLastSeen(Number(window.localStorage.getItem(lastSeenKey) || 0));
    setClearedBefore(Number(window.localStorage.getItem(clearedKey) || 0));
  }, [lastSeenKey, clearedKey]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await jsonFetch("/api/known-driver-events");
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error("Unable to load driver notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!id) return;
    const channelName = role === "parent" ? `private-known-driver-parent-${id}` : `private-known-driver-driver-${id}`;
    const channel = process.env.NEXT_PUBLIC_PUSHER_KEY ? pusherClient.subscribe(channelName) : null;
    const handleUpdate = () => loadEvents();

    channel?.bind("driver-location-updated", handleUpdate);
    channel?.bind("child-driver-event", handleUpdate);

    return () => {
      channel?.unbind("driver-location-updated", handleUpdate);
      channel?.unbind("child-driver-event", handleUpdate);
      if (channel) pusherClient.unsubscribe(channelName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, id]);

  useEffect(() => {
    if (!open) return;
    const handleClickAway = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPosition({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const visibleEvents = useMemo(
    () => events.filter((event) => new Date(event.createdAt).getTime() > clearedBefore),
    [events, clearedBefore]
  );

  const unreadCount = useMemo(
    () => visibleEvents.filter((event) => new Date(event.createdAt).getTime() > lastSeen).length,
    [visibleEvents, lastSeen]
  );

  const toggleOpen = () => {
    setOpen((current) => {
      const next = !current;
      if (next) {
        const now = Date.now();
        window.localStorage.setItem(lastSeenKey, String(now));
        setLastSeen(now);
      }
      return next;
    });
  };

  const clearAll = () => {
    const now = Date.now();
    window.localStorage.setItem(clearedKey, String(now));
    window.localStorage.setItem(lastSeenKey, String(now));
    setClearedBefore(now);
    setLastSeen(now);
  };

  const viewOnMap = (event: DriverEvent) => {
    window.dispatchEvent(
      new CustomEvent("standalone-parent:view-location", { detail: { assignmentId: event.assignmentId } })
    );
    setOpen(false);
  };

  const shareLocation = (event: DriverEvent) => {
    window.dispatchEvent(
      new CustomEvent("standalone-driver:share-location", { detail: { assignmentId: event.assignmentId } })
    );
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950/20 active:scale-95"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {mounted && open && panelPosition &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: panelPosition.top, right: panelPosition.right }}
            className="fixed z-[60] w-[min(90vw,360px)] rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-semibold text-slate-950">Notifications</p>
              {visibleEvents.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-950"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading...
                </div>
              )}
              {!loading && !visibleEvents.length && (
                <p className="p-4 text-center text-sm text-slate-500">No activity yet.</p>
              )}
              {!loading &&
                visibleEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-slate-50">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800">{eventMessage(event, role)}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-xs text-slate-400">{formatRelativeTime(event.createdAt)}</span>
                        {role === "parent" && event.eventType === "LOCATION_UPDATED" && (
                          <button
                            type="button"
                            onClick={() => viewOnMap(event)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            View on map
                          </button>
                        )}
                        {role === "driver" && event.eventType === "LOCATION_REQUESTED" && (
                          <button
                            type="button"
                            onClick={() => shareLocation(event)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            <Navigation className="h-3 w-3" aria-hidden="true" /> Share location
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
