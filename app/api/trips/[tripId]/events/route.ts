import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { runDeduplicatedMobileEvent } from "@/lib/mobile/deduplication";
import { canAccessTrip } from "@/lib/trip-access";
import { recordTripEvent } from "@/lib/trip-events";
import { TripEventType } from "@prisma/client";
import { getTripOwnerEntitlements } from "@/lib/billing/trip-entitlements";
import { hasFeature } from "@/lib/billing/entitlements";
import db from "@/packages/db/client";

const eventTypes = new Set<TripEventType>([
  "trip_started",
  "trip_paused",
  "trip_ended",
  "participant_present",
  "participant_boarded",
  "participant_dropped",
  "participant_absent",
  "stop_reached",
  "route_deviation",
  "unusual_stop",
  "emergency_triggered",
  "emergency_resolved",
  "eta_updated",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const session = await getApiSession();
  const allowed = await canAccessTrip(tripId, session);

  if (!allowed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!session || !["admin", "school", "teacher", "driver"].includes(session.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const eventType = body?.eventType;

  if (!eventTypes.has(eventType)) {
    return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
  }
  const status =
    eventType === "trip_started"
      ? "active"
      : eventType === "trip_paused"
        ? "paused"
        : eventType === "trip_ended"
          ? "completed"
          : undefined;

  const createEvent = () =>
    recordTripEvent({
      tripId,
      eventType,
      actorId: session?.id,
      actorType: session?.role,
      payload:
        body?.payload && typeof body.payload === "object"
          ? body.payload
          : undefined,
      status,
    });
  const recorded =
    session?.mobileSession &&
    ["parent", "driver", "teacher"].includes(session.role)
      ? await runDeduplicatedMobileEvent({
          actor: session as typeof session & {
            role: "parent" | "driver" | "teacher";
          },
          clientEventId: body?.clientEventId,
          eventType: `trip_event:${eventType}`,
          action: createEvent,
        })
      : { value: await createEvent(), duplicate: false };
  const event = recorded.value;

  const studentId =
    body?.payload && typeof body.payload.studentId === "string"
      ? body.payload.studentId
      : null;
  if (studentId && !recorded.duplicate) {
    const resolved = await getTripOwnerEntitlements(tripId);
    if (resolved && hasFeature(resolved, "attendance_automation")) {
      const updates =
        eventType === "participant_present"
          ? { attendance: "PRESENT" as const }
          : eventType === "participant_absent"
            ? { attendance: "ABSENT" as const }
            : eventType === "participant_boarded"
              ? { status: "PICKED" as const, presence: "IN_BUS" as const }
              : eventType === "participant_dropped"
                ? { status: "DROPPED" as const, presence: "AT_SCHOOL" as const }
                : null;
      if (updates) {
        const trip = await db.trip.findUnique({
          where: { id: tripId },
          select: { schoolId: true },
        });
        await db.student.updateMany({
          where: { id: studentId, schoolId: trip?.schoolId ?? undefined },
          data: updates,
        });
      }
    }
  }

  return NextResponse.json(
    { event, duplicate: recorded.duplicate },
    { status: recorded.duplicate ? 200 : 201 }
  );
}
