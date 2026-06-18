import type { Assignment } from "./types";

export const inputClass =
  "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-none";

export async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function formatRelativeActivity(value?: string | Date | null) {
  if (!value) return "No recent activity";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "No recent activity";

  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return "Active just now";
  if (minutes < 60) return `Last active ${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last active ${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  return `Last active ${days} day${days === 1 ? "" : "s"} ago`;
}

export function statusTone(status?: string | null) {
  if (status === "PARENT_APPROVED" || status === "ACTIVE" || status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "REVOKED" || status === "DECLINED" || status === "FAILED" || status === "PAST_DUE") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
}

export function childPlaceLabel(assignment: Assignment) {
  const statusEvents = (assignment.events || [])
    .filter((event) => ["ON_THE_WAY_TO_SCHOOL", "PICKED_UP", "DROPPED_OFF"].includes(event.eventType))
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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

export function schoolKey(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}
