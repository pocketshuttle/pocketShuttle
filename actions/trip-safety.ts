"use server";

import { revalidateTag } from "next/cache";

import { getUserSession } from "@/lib/session";
import { recordTripEvent } from "@/lib/trip-events";
import db from "@/packages/db/client";
import { SafetyState, TripEventType, TripStatus } from "@prisma/client";

type SafetyActionInput = {
  tripId: string;
  note?: string;
};

type ShareTripInput = {
  tripId: string;
  viewerId: string;
  viewerType: string;
  minutes?: number;
};

const authorizedRoles = new Set(["admin", "school", "teacher", "driver"]);

function getRole(role?: unknown) {
  return String(role ?? "").toLowerCase();
}

async function getAuthorizedTrip(tripId: string, user: Awaited<ReturnType<typeof getUserSession>>) {
  const role = getRole(user?.role);
  const actorId = typeof user?.id === "string" ? user.id : null;
  const schoolId = typeof user?.schoolId === "string" ? user.schoolId : actorId;

  if (!actorId || !authorizedRoles.has(role)) {
    return null;
  }

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      OR: [
        { createdBy: actorId },
        { schoolId },
        { driverId: actorId },
      ],
    },
  });

  if (trip || !actorId) {
    return trip;
  }

  const scopedTrip = await db.trip.findUnique({ where: { id: tripId } });
  if (!scopedTrip?.busId) {
    return null;
  }

  const assignedBus = await db.buses.findFirst({
    where: {
      id: scopedTrip.busId,
      OR: [{ teacher: { id: actorId } }, { driver: { id: actorId } }],
    },
    select: { id: true },
  });

  return assignedBus ? scopedTrip : null;
}

async function getTripVehicleName(trip: NonNullable<Awaited<ReturnType<typeof getAuthorizedTrip>>>) {
  if (!trip.busId) {
    return trip.title;
  }

  const bus = await db.buses.findUnique({
    where: { id: trip.busId },
    select: { bus_product_name: true },
  });

  return bus?.bus_product_name ?? trip.title;
}

async function recordSafetyEvent({
  tripId,
  note,
  eventType,
  status,
  safetyState,
}: SafetyActionInput & {
  eventType: TripEventType;
  status: TripStatus;
  safetyState: SafetyState;
}) {
  const user = await getUserSession();
  const trip = await getAuthorizedTrip(tripId, user);

  if (!trip) {
    return { status: 401, message: "Unauthorized" };
  }

  const vehicleName = await getTripVehicleName(trip);

  await recordTripEvent({
    tripId,
    eventType,
    actorId: String(user?.id),
    actorType: getRole(user?.role),
    status,
    safetyState,
    payload: {
      source: "trip_safety",
      note: note ?? null,
      busName: vehicleName,
    },
  });

  revalidateTag("bus");
  revalidateTag("trips");

  return { status: 200, message: "Trip safety state updated" };
}

export async function triggerTripEmergency(input: SafetyActionInput) {
  return recordSafetyEvent({
    ...input,
    eventType: "emergency_triggered",
    status: "emergency",
    safetyState: "emergency",
  });
}

export async function resolveTripEmergency(input: SafetyActionInput) {
  return recordSafetyEvent({
    ...input,
    eventType: "emergency_resolved",
    status: "active",
    safetyState: "normal",
  });
}

export async function flagTripUnusualStop(input: SafetyActionInput) {
  return recordSafetyEvent({
    ...input,
    eventType: "unusual_stop",
    status: "paused",
    safetyState: "attention",
  });
}

export async function flagTripRouteDeviation(input: SafetyActionInput) {
  return recordSafetyEvent({
    ...input,
    eventType: "route_deviation",
    status: "paused",
    safetyState: "attention",
  });
}

export async function shareTripTemporarily({
  tripId,
  viewerId,
  viewerType,
  minutes = 60,
}: ShareTripInput) {
  const user = await getUserSession();
  const trip = await getAuthorizedTrip(tripId, user);

  if (!trip) {
    return { status: 401, message: "Unauthorized" };
  }

  const { getEntitlements, assertWithinLimit, requireFeature } = await import(
    "@/lib/billing/entitlements"
  );
  const role = getRole(user?.role);
  const resolved = await getEntitlements({
    id: String(user?.id),
    role,
    schoolId:
      typeof user?.schoolId === "string" ? user.schoolId : null,
  });
  const viewerCount = await db.tripViewer.count({
    where: {
      tripId,
      expiresAt: { gt: new Date() },
    },
  });
  requireFeature(resolved, "multiple_viewers");
  assertWithinLimit(resolved, "max_viewers", viewerCount);

  const expiresAt = new Date(Date.now() + Math.max(5, minutes) * 60 * 1000);

  await db.tripViewer.upsert({
    where: {
      tripId_viewerType_viewerId: {
        tripId,
        viewerType,
        viewerId,
      },
    },
    create: {
      tripId,
      viewerType,
      viewerId,
      expiresAt,
      permissions: ["view_location", "view_events", "receive_alerts"],
      metadata: {
        source: "temporary_share",
        sharedBy: String(user?.id),
      },
    },
    update: {
      expiresAt,
      permissions: ["view_location", "view_events", "receive_alerts"],
      metadata: {
        source: "temporary_share",
        sharedBy: String(user?.id),
      },
    },
  });

  await recordTripEvent({
    tripId,
    eventType: "eta_updated",
    actorId: String(user?.id),
    actorType: getRole(user?.role),
    notify: false,
    payload: {
      source: "temporary_share",
      viewerId,
      viewerType,
      expiresAt: expiresAt.toISOString(),
    },
  });

  revalidateTag("bus");
  revalidateTag("trips");

  return { status: 200, message: "Trip shared temporarily" };
}
