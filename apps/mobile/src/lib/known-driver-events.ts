import type { KnownDriverEvent } from "../types";

/** Port of the web notification bell's eventMessage(). */
export function knownDriverEventMessage(event: KnownDriverEvent, role: "parent" | "driver") {
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

export function knownDriverEventTitle(eventType: string) {
  switch (eventType) {
    case "LOCATION_UPDATED":
      return "Location shared";
    case "LOCATION_REQUESTED":
      return "Location requested";
    case "PICKED_UP":
      return "Picked up";
    case "DROPPED_OFF":
      return "Dropped off";
    case "ON_THE_WAY_TO_SCHOOL":
      return "On the way";
    case "ALERT_SENT":
      return "Alert sent";
    default:
      return "Update";
  }
}

export function lastSeenKey(role: string, id: string) {
  return `pocketshuttle.mobile.known-driver-last-seen:${role}:${id}`;
}
