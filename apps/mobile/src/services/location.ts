import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import Storage from "expo-sqlite/kv-store";
import * as TaskManager from "expo-task-manager";

import { flushMobileEventQueue, sendOrQueueMobileEvent } from "./offline-queue";

export const DRIVER_LOCATION_TASK = "pocketshuttle-driver-location";
const ACTIVE_TRIP_KEY = "pocketshuttle.mobile.active-trip";

TaskManager.defineTask(
  DRIVER_LOCATION_TASK,
  async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
    if (error || !data) return;
    const locations = (data as { locations?: Location.LocationObject[] }).locations;
    if (!locations?.length) return;
    const tripId = await Storage.getItem(ACTIVE_TRIP_KEY);
    if (!tripId) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(
        () => undefined
      );
      return;
    }
    for (const location of locations) {
      await sendOrQueueMobileEvent({
        id: Crypto.randomUUID(),
        path: `/api/trips/${tripId}/location`,
        method: "POST",
        body: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
          recordedAt: new Date(location.timestamp).toISOString(),
        },
      });
      await sendOrQueueMobileEvent({
        id: Crypto.randomUUID(),
        path: "/api/drivers/location",
        method: "POST",
        body: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          continuous: true,
          recordedAt: new Date(location.timestamp).toISOString(),
        },
      });
    }
    await flushMobileEventQueue();
  }
);

export async function startDriverTracking(tripId: string) {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    throw new Error("Precise location permission is required.");
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") {
    throw new Error(
      "Allow background location so families can follow an active trip."
    );
  }
  await Storage.setItem(ACTIVE_TRIP_KEY, tripId);
  const running = await Location.hasStartedLocationUpdatesAsync(
    DRIVER_LOCATION_TASK
  );
  if (!running) {
    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10_000,
      distanceInterval: 25,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: "PocketShuttle trip is active",
        notificationBody:
          "Location sharing is on for authorized families and school staff.",
        notificationColor: "#4A48FF",
      },
    });
  }
}

export async function stopDriverTracking() {
  await Storage.removeItem(ACTIVE_TRIP_KEY);
  if (await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  }
}

export async function activeTrackingTripId() {
  return Storage.getItem(ACTIVE_TRIP_KEY);
}

// --- Known-driver network sharing (outside trips), mirrors the web driver dashboard ---

const FOREGROUND_SHARE_THROTTLE_MS = 15_000;
let foregroundSubscription: Location.LocationSubscription | null = null;
let lastForegroundShareAt = 0;

async function requireForegroundPermission() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission is required to share your location.");
  }
}

async function postDriverLocation(
  coords: Location.LocationObjectCoords,
  continuous: boolean
) {
  return sendOrQueueMobileEvent(
    {
      id: Crypto.randomUUID(),
      path: "/api/drivers/location",
      method: "POST",
      body: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        continuous,
      },
    },
    { queueOnlyWhenOffline: true }
  );
}

/** One-shot "Share location now". Returns the coordinates that were sent. */
export async function shareLocationOnce() {
  await requireForegroundPermission();
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  await postDriverLocation(position.coords, false);
  return position.coords;
}

export function isForegroundSharing() {
  return foregroundSubscription !== null;
}

/** Continuous sharing while the app is open (15 s throttle). No-op while a trip's background task is running. */
export async function startForegroundSharing() {
  if (foregroundSubscription) return;
  if (await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)) return;
  await requireForegroundPermission();
  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 10_000,
      distanceInterval: 20,
    },
    (position) => {
      const now = Date.now();
      if (now - lastForegroundShareAt < FOREGROUND_SHARE_THROTTLE_MS) return;
      lastForegroundShareAt = now;
      void postDriverLocation(position.coords, true).catch(() => undefined);
    }
  );
}

export function stopForegroundSharing() {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
}
