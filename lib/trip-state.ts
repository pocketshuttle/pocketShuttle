export type TripStateLocation = {
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  timestamp?: Date | string | null;
};

export type TripStateEvent = {
  eventType: string;
  timestamp?: Date | string | null;
};

export type TripStateInput = {
  status?: string | null;
  safetyState?: string | null;
  locations?: TripStateLocation[];
  events?: TripStateEvent[];
};

export type TripMovementState = {
  label: "Idle" | "On the way" | "In transit" | "Stopped" | "Arrived" | "Emergency";
  reason: string;
  tone: string;
  priority: "normal" | "attention" | "emergency";
  isStale: boolean;
};

const STALE_LOCATION_MS = 2 * 60 * 1000;
const UNUSUAL_STOP_SPEED = 1;

export function getLatestTripLocation(trip?: TripStateInput | null) {
  return trip?.locations?.[0] ?? null;
}

export function getLatestTripEvent(trip?: TripStateInput | null) {
  return trip?.events?.[0] ?? null;
}

export function getLocationAgeMs(location?: TripStateLocation | null, now = new Date()) {
  if (!location?.timestamp) return null;

  const timestamp = new Date(location.timestamp).getTime();
  if (!Number.isFinite(timestamp)) return null;

  return now.getTime() - timestamp;
}

export function isTripLocationStale(location?: TripStateLocation | null, now = new Date()) {
  const age = getLocationAgeMs(location, now);
  return age !== null && age > STALE_LOCATION_MS;
}

export function deriveTripMovementState(
  trip?: TripStateInput | null,
  now = new Date()
): TripMovementState {
  const latestLocation = getLatestTripLocation(trip);
  const latestEvent = getLatestTripEvent(trip);
  const latestEventType = latestEvent?.eventType;
  const isStale = isTripLocationStale(latestLocation, now);
  const speed = latestLocation?.speed ?? null;

  if (trip?.status === "emergency" || trip?.safetyState === "emergency") {
    return {
      label: "Emergency",
      reason: "Emergency event is active",
      tone: "bg-red-100 text-red-800 border-red-200",
      priority: "emergency",
      isStale,
    };
  }

  if (latestEventType === "emergency_triggered") {
    return {
      label: "Emergency",
      reason: "Emergency was triggered",
      tone: "bg-red-100 text-red-800 border-red-200",
      priority: "emergency",
      isStale,
    };
  }

  if (isStale && trip?.status === "active") {
    return {
      label: "Stopped",
      reason: "Live location has not updated recently",
      tone: "bg-orange-100 text-orange-800 border-orange-200",
      priority: "attention",
      isStale,
    };
  }

  if (latestEventType === "unusual_stop" || latestEventType === "route_deviation") {
    return {
      label: "Stopped",
      reason: latestEventType === "route_deviation" ? "Route deviation detected" : "Unusual stop detected",
      tone: "bg-orange-100 text-orange-800 border-orange-200",
      priority: "attention",
      isStale,
    };
  }

  if (trip?.safetyState === "attention") {
    return {
      label: "Stopped",
      reason: "Trip needs attention",
      tone: "bg-orange-100 text-orange-800 border-orange-200",
      priority: "attention",
      isStale,
    };
  }

  if (trip?.status === "completed" || latestEventType === "trip_ended") {
    return {
      label: "Arrived",
      reason: "Trip ended",
      tone: "bg-sky-100 text-sky-800 border-sky-200",
      priority: "normal",
      isStale,
    };
  }

  if (trip?.status === "active" && latestEventType === "trip_started") {
    return {
      label: "On the way",
      reason: "Trip started",
      tone: "bg-amber-100 text-amber-800 border-amber-200",
      priority: "normal",
      isStale,
    };
  }

  if (
    trip?.status === "active" &&
    speed !== null &&
    speed <= UNUSUAL_STOP_SPEED &&
    latestLocation
  ) {
    return {
      label: "Stopped",
      reason: "Vehicle is stationary",
      tone: "bg-orange-100 text-orange-800 border-orange-200",
      priority: "attention",
      isStale,
    };
  }

  if (
    trip?.status === "active" ||
    latestEventType === "participant_boarded" ||
    latestEventType === "stop_reached"
  ) {
    return {
      label: "In transit",
      reason: "Trip is active",
      tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
      priority: "normal",
      isStale,
    };
  }

  return {
    label: "Idle",
    reason: "No active trip movement",
    tone: "bg-slate-100 text-slate-600 border-slate-200",
    priority: "normal",
    isStale,
  };
}
