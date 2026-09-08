import type { StatusEvent } from "../types";

const STATUS_EVENT_TYPES = ["ON_THE_WAY_TO_SCHOOL", "PICKED_UP", "DROPPED_OFF"];

/** Port of the web dashboard's childPlaceLabel(): derives "where the child is" from status history. */
export function childPlaceLabel(assignment: {
  lastStatus?: string | null;
  events?: StatusEvent[] | null;
}) {
  const statusEvents = (assignment.events || [])
    .filter((event) => STATUS_EVENT_TYPES.includes(event.eventType))
    .slice()
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  const pickupCount = statusEvents.filter((event) => event.eventType === "PICKED_UP").length;

  if (assignment.lastStatus === "DROPPED_OFF") {
    return pickupCount > 0 && pickupCount % 2 === 0 ? "At home" : "In school";
  }
  if (assignment.lastStatus === "PICKED_UP") {
    return pickupCount > 0 && pickupCount % 2 === 0 ? "On the way home" : "On the way to school";
  }
  if (assignment.lastStatus === "ON_THE_WAY_TO_SCHOOL") {
    return "Driver on the way";
  }
  return "Waiting";
}

export const tripStages = [
  { action: "on_the_way", eventType: "ON_THE_WAY_TO_SCHOOL", label: "On the way" },
  { action: "picked_up", eventType: "PICKED_UP", label: "Picked up" },
  { action: "dropped_off", eventType: "DROPPED_OFF", label: "Dropped off" },
] as const;

export type TripStageAction = (typeof tripStages)[number]["action"];

export function humanizeStatus(value?: string | null) {
  if (!value) return "Waiting";
  return value.toLowerCase().replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

export function mapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/** "connectedDrivers" / "max_children" -> "Connected drivers". */
export function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
