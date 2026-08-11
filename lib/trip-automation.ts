import "server-only";

import { Prisma } from "@prisma/client";

import { hasFeature } from "@/lib/billing/entitlements";
import { getTripOwnerEntitlements } from "@/lib/billing/trip-entitlements";
import { dispatchTripNotifications } from "@/lib/trip-notifications";
import db from "@/packages/db/client";

export type Point = { lat: number; lng: number };

export function distanceMeters(left: Point, right: Point) {
  const radius = 6371e3;
  const phi1 = (left.lat * Math.PI) / 180;
  const phi2 = (right.lat * Math.PI) / 180;
  const deltaPhi = ((right.lat - left.lat) * Math.PI) / 180;
  const deltaLambda = ((right.lng - left.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routePoints(metadata: Prisma.JsonValue | null): Point[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const path = (metadata as Record<string, unknown>).routePath;
  if (!Array.isArray(path)) return [];
  return path.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const lat = (item as Record<string, unknown>).lat;
    const lng = (item as Record<string, unknown>).lng;
    return typeof lat === "number" && typeof lng === "number" ? [{ lat, lng }] : [];
  });
}

export function jsonPoint(value: Prisma.JsonValue | null): Point | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const lat =
    typeof record.lat === "number"
      ? record.lat
      : typeof record.latitude === "number"
        ? record.latitude
        : null;
  const lng =
    typeof record.lng === "number"
      ? record.lng
      : typeof record.longitude === "number"
        ? record.longitude
        : null;
  return lat !== null && lng !== null ? { lat, lng } : null;
}

async function recentlyEmitted(tripId: string, eventType: "unusual_stop" | "route_deviation") {
  return db.tripEvent.findFirst({
    where: {
      tripId,
      eventType,
      timestamp: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
    select: { id: true },
  });
}

async function emitSafetyEvent(
  tripId: string,
  eventType: "unusual_stop" | "route_deviation",
  payload: Prisma.InputJsonValue
) {
  if (await recentlyEmitted(tripId, eventType)) return;
  await db.$transaction([
    db.tripEvent.create({
      data: {
        tripId,
        eventType,
        actorType: "system",
        payload,
      },
    }),
    db.trip.update({
      where: { id: tripId },
      data: { safetyState: "attention" },
    }),
  ]);
  await dispatchTripNotifications({
    tripId,
    eventType,
    payload: payload as Record<string, unknown>,
  });
}

export async function evaluateTripLocationAutomation(input: {
  tripId: string;
  lat: number;
  lng: number;
  speed?: number | null;
}) {
  const resolved = await getTripOwnerEntitlements(input.tripId);
  if (!resolved) return;

  const trip = await db.trip.findUnique({
    where: { id: input.tripId },
    select: { id: true, status: true, metadata: true, destination: true },
  });
  if (!trip || trip.status !== "active") return;
  const point = { lat: input.lat, lng: input.lng };

  if (hasFeature(resolved, "eta_alerts")) {
    const destination = jsonPoint(trip.destination);
    if (destination) {
      const distance = distanceMeters(point, destination);
      const nearby = distance <= 1000;
      const recentEta = await db.tripEvent.findFirst({
        where: {
          tripId: input.tripId,
          eventType: "eta_updated",
          actorType: "system",
          timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
        orderBy: { timestamp: "desc" },
      });
      const wasNearby =
        recentEta?.payload &&
        typeof recentEta.payload === "object" &&
        !Array.isArray(recentEta.payload) &&
        (recentEta.payload as Record<string, unknown>).nearby === true;
      if (!recentEta || (nearby && !wasNearby)) {
        const metersPerSecond = Math.max(input.speed ?? 0, 8);
        const etaMinutes = Math.max(1, Math.round(distance / metersPerSecond / 60));
        const event = await db.tripEvent.create({
          data: {
            tripId: input.tripId,
            eventType: "eta_updated",
            actorType: "system",
            payload: {
              source: "automatic_eta",
              distanceMeters: Math.round(distance),
              etaMinutes,
              nearby,
            },
          },
        });
        if (nearby) {
          await dispatchTripNotifications({
            tripId: input.tripId,
            eventType: "eta_updated",
            payload: {
              source: "automatic_eta",
              etaMinutes,
              nearby,
              eventId: event.id,
            },
          });
        }
      }
    }
  }

  if (hasFeature(resolved, "geofences")) {
    const places = await db.customPlace.findMany({
      where: { billingAccountId: resolved.billingAccountId, isActive: true },
    });
    for (const place of places) {
      const inside =
        distanceMeters(point, { lat: place.latitude, lng: place.longitude }) <=
        place.radiusMeters;
      const previous = await db.tripGeofenceState.findUnique({
        where: { tripId_placeId: { tripId: input.tripId, placeId: place.id } },
      });
      await db.tripGeofenceState.upsert({
        where: { tripId_placeId: { tripId: input.tripId, placeId: place.id } },
        create: {
          tripId: input.tripId,
          placeId: place.id,
          isInside: inside,
          lastEventAt: inside ? new Date() : null,
        },
        update: {
          isInside: inside,
          ...(previous?.isInside !== inside ? { lastEventAt: new Date() } : {}),
        },
      });
      if (inside && previous && !previous.isInside) {
        await db.tripEvent.create({
          data: {
            tripId: input.tripId,
            eventType: "stop_reached",
            actorType: "system",
            payload: { source: "geofence", placeId: place.id, placeName: place.name },
          },
        });
      }
    }
  }

  if (!hasFeature(resolved, "safety_detection")) return;
  const recentLocations = await db.tripLocation.findMany({
    where: {
      tripId: input.tripId,
      timestamp: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
    orderBy: { timestamp: "asc" },
    take: 120,
  });

  if (recentLocations.length >= 3 && (input.speed ?? 0) <= 1) {
    const first = recentLocations[0];
    if (distanceMeters(point, { lat: first.lat, lng: first.lng }) < 50) {
      await emitSafetyEvent(input.tripId, "unusual_stop", {
        source: "automatic_detection",
        stationaryMinutes: 10,
      });
    }
  }

  const path = routePoints(trip.metadata);
  if (path.length) {
    const nearest = Math.min(...path.map((target) => distanceMeters(point, target)));
    if (nearest > 500) {
      await emitSafetyEvent(input.tripId, "route_deviation", {
        source: "automatic_detection",
        distanceMeters: Math.round(nearest),
      });
    }
  }
}
