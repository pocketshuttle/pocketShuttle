"use client";

const ONESIGNAL_ALLOWED_ORIGINS = new Set([
  "https://app.pocketshuttle.com",
  "https://www.pocketshuttle.com",
]);

export function canUseOneSignal() {
  if (typeof window === "undefined") {
    return false;
  }

  return ONESIGNAL_ALLOWED_ORIGINS.has(window.location.origin);
}
