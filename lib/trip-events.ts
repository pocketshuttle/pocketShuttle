import "server-only";

import db, {
  StudentAttendance,
  StudentPresence,
  StudentStatus,
} from "@/packages/db/client";
import { dispatchTripNotifications } from "@/lib/trip-notifications";
import {
  Prisma,
  SafetyState,
  TripEventType,
  TripParticipantStatus,
  TripStatus,
  TripType,
} from "@prisma/client";

type StudentMovementRecord = {
  id: string;
  full_name: string | null;
  schoolId: string;
  parentId: string | null;
  teacherId: string | null;
  busId: string | null;
  attendance: StudentAttendance | null;
  status: StudentStatus | null;
  presence: StudentPresence | null;
  parent?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  bus?: {
    id: string;
    bus_product_name: string;
    teacher?: {
      id: string;
    } | null;
  } | null;
};

type MovementEventInput = {
  student: StudentMovementRecord;
  actorId?: string | null;
  actorType?: string | null;
  source: "attendance" | "status" | "presence";
  value: StudentAttendance | StudentStatus | StudentPresence;
  eta?: string | null;
};

type RecordTripEventInput = {
  tripId: string;
  eventType: TripEventType;
  actorId?: string | null;
  actorType?: string | null;
  payload?: Prisma.InputJsonValue;
  status?: TripStatus;
  safetyState?: SafetyState;
  notify?: boolean;
};

type RecordTripLocationInput = {
  tripId: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
};

type EnsureTripInput = {
  tripType: TripType;
  title: string;
  status?: TripStatus;
  safetyState?: SafetyState;
  schoolId?: string | null;
  busId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  createdBy?: string | null;
  metadata?: Prisma.InputJsonValue;
};

const ACTIVE_TRIP_STATUSES: TripStatus[] = ["scheduled", "active", "paused"];

function getTodayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTripEventForMovement(input: MovementEventInput): TripEventType {
  if (input.source === "attendance" && input.value === "ABSENT") {
    return "participant_absent";
  }

  if (input.source === "attendance" && input.value === "PRESENT") {
    return "participant_present";
  }

  if (input.source === "status" && input.value === "PICKED") {
    return "participant_boarded";
  }

  if (input.source === "status" && input.value === "DROPPED") {
    return "participant_dropped";
  }

  if (input.source === "presence" && input.value === "ON_THE_WAY") {
    return "trip_started";
  }

  if (input.source === "presence" && input.value === "NONE") {
    return "trip_paused";
  }

  return "eta_updated";
}

function getParticipantStatusForMovement(
  input: MovementEventInput
): TripParticipantStatus {
  if (input.source === "attendance" && input.value === "ABSENT") {
    return "absent";
  }

  if (input.source === "status" && input.value === "PICKED") {
    return "boarded";
  }

  if (input.source === "status" && input.value === "DROPPED") {
    return "dropped";
  }

  return input.student.status === "PICKED" ? "boarded" : "scheduled";
}

function getTripStatusForMovement(input: MovementEventInput): TripStatus | null {
  if (input.source === "presence" && input.value === "ON_THE_WAY") {
    return "active";
  }

  if (input.source === "presence" && input.value === "NONE") {
    return "paused";
  }

  return null;
}

function getSafetyStateForMovement(): SafetyState {
  return "normal";
}

function getActorType(role?: string | null) {
  return role ? role.toLowerCase() : null;
}

export async function recordTripEvent({
  tripId,
  eventType,
  actorId,
  actorType,
  payload,
  status,
  safetyState,
  notify = true,
}: RecordTripEventInput) {
  const event = await db.tripEvent.create({
    data: {
      tripId,
      eventType,
      actorId: actorId ?? null,
      actorType: getActorType(actorType),
      payload: payload ?? undefined,
    },
  });

  if (status || safetyState) {
    await db.trip.update({
      where: { id: tripId },
      data: {
        ...(status ? { status } : {}),
        ...(safetyState ? { safetyState } : {}),
        ...(status === "active" ? { startedAt: new Date() } : {}),
        ...(status === "completed" ? { endedAt: new Date() } : {}),
      },
    });
  }

  if (notify) {
    await dispatchTripNotifications({
      tripId,
      eventType,
      payload: payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null,
    });
  }

  try {
    const { getPusherInstance } = await import("@/pusher/server");
    await getPusherInstance().trigger(`private-trip-${tripId}`, "trip-event", {
      id: event.id,
      tripId,
      eventType,
      actorType: getActorType(actorType),
      payload: payload ?? null,
      timestamp: event.timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Trip realtime event failed:", error);
  }

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { schoolId: true },
  });
  if (trip?.schoolId) {
    const { enqueueSchoolWebhookEvent } = await import("@/lib/enterprise/webhooks");
    await enqueueSchoolWebhookEvent({
      schoolId: trip.schoolId,
      eventId: event.id,
      eventType,
      payload: {
        tripId,
        eventType,
        actorId: actorId ?? null,
        actorType: actorType ?? null,
        payload: payload ?? null,
        timestamp: event.timestamp.toISOString(),
      },
    });
  }

  return event;
}

export async function recordTripLocation({
  tripId,
  lat,
  lng,
  accuracy,
  speed,
  heading,
}: RecordTripLocationInput) {
  const location = await db.tripLocation.create({
    data: {
      tripId,
      lat,
      lng,
      accuracy: accuracy ?? null,
      speed: speed ?? null,
      heading: heading ?? null,
    },
  });
  const { evaluateTripLocationAutomation } = await import("@/lib/trip-automation");
  await evaluateTripLocationAutomation({
    tripId,
    lat,
    lng,
    speed: speed ?? null,
  });
  try {
    const { getPusherInstance } = await import("@/pusher/server");
    await getPusherInstance().trigger(
      `private-trip-${tripId}`,
      "trip-location-updated",
      {
        tripId,
        location: {
          id: location.id,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.timestamp.toISOString(),
        },
      }
    );
  } catch (error) {
    console.error("Trip realtime location failed:", error);
  }
  return location;
}

export async function ensureTrip({
  tripType,
  title,
  status = "scheduled",
  safetyState = "normal",
  schoolId,
  busId,
  vehicleId,
  driverId,
  createdBy,
  metadata,
}: EnsureTripInput) {
  return db.trip.create({
    data: {
      tripType,
      title,
      status,
      safetyState,
      schoolId: schoolId ?? null,
      busId: busId ?? null,
      vehicleId: vehicleId ?? busId ?? null,
      driverId: driverId ?? null,
      createdBy: createdBy ?? null,
      metadata: metadata ?? undefined,
      startedAt: status === "active" ? new Date() : null,
    },
  });
}

export async function recordStudentMovementTripEvent({
  student,
  actorId,
  actorType,
  source,
  value,
  eta,
}: MovementEventInput) {
  const busId = student.busId ?? student.bus?.id ?? null;
  const todayStart = getTodayStart();
  const movement = { student, actorId, actorType, source, value, eta };
  const tripStatus = getTripStatusForMovement(movement);
  const eventType = getTripEventForMovement(movement);
  const participantStatus = getParticipantStatusForMovement(movement);

  const existingTrip = await db.trip.findFirst({
    where: {
      tripType: "school_trip",
      schoolId: student.schoolId,
      vehicleId: busId,
      status: {
        in: ACTIVE_TRIP_STATUSES,
      },
      createdAt: {
        gte: todayStart,
      },
    },
  });

  const trip =
    existingTrip ??
    (await db.trip.create({
      data: {
        tripType: "school_trip",
        title: `${student.bus?.bus_product_name ?? "School trip"} - ${todayStart.toDateString()}`,
        status: tripStatus ?? "scheduled",
        safetyState: getSafetyStateForMovement(),
        schoolId: student.schoolId,
        busId,
        vehicleId: busId,
        createdBy: actorId ?? student.teacherId ?? student.schoolId,
        metadata: {
          legacySource: "school_student_flow",
        },
      },
    }));

  await db.trip.update({
    where: { id: trip.id },
    data: {
      ...(tripStatus ? { status: tripStatus } : {}),
      safetyState: getSafetyStateForMovement(),
      startedAt:
        tripStatus === "active" && !trip.startedAt ? new Date() : trip.startedAt,
    },
  });

  await db.tripParticipant.upsert({
    where: {
      tripId_participantType_participantId: {
        tripId: trip.id,
        participantType: "student",
        participantId: student.id,
      },
    },
    create: {
      tripId: trip.id,
      participantType: "student",
      participantId: student.id,
      role: "child",
      status: participantStatus,
      boardedAt: participantStatus === "boarded" ? new Date() : null,
      droppedAt: participantStatus === "dropped" ? new Date() : null,
      metadata: {
        studentName: student.full_name,
        legacyStudentStatus: student.status,
        legacyStudentPresence: student.presence,
      },
    },
    update: {
      status: participantStatus,
      boardedAt: participantStatus === "boarded" ? new Date() : undefined,
      droppedAt: participantStatus === "dropped" ? new Date() : undefined,
      metadata: {
        studentName: student.full_name,
        legacyStudentStatus: student.status,
        legacyStudentPresence: student.presence,
      },
    },
  });

  const parentViewerId = student.parentId ?? student.parent?.id ?? null;
  if (parentViewerId) {
    await db.tripViewer.upsert({
      where: {
        tripId_viewerType_viewerId: {
          tripId: trip.id,
          viewerType: "parent",
          viewerId: parentViewerId,
        },
      },
      create: {
        tripId: trip.id,
        viewerType: "parent",
        viewerId: parentViewerId,
        permissions: ["view_location", "view_events", "receive_alerts"],
      },
      update: {
        permissions: ["view_location", "view_events", "receive_alerts"],
      },
    });
  }

  await recordTripEvent({
    tripId: trip.id,
    eventType,
    actorId,
    actorType,
    payload: {
      source,
      value,
      eta,
      studentId: student.id,
      studentName: student.full_name,
      parentId: student.parentId ?? student.parent?.id ?? null,
      parentName: student.parent?.full_name ?? null,
      parentEmail: student.parent?.email ?? null,
      parentPhone: student.parent?.phoneNumber ?? null,
      busId,
      busName: student.bus?.bus_product_name ?? null,
      schoolId: student.schoolId,
    },
  });

  return trip;
}
