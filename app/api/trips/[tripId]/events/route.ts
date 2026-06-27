import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { canAccessTrip } from "@/lib/trip-access";
import { recordTripEvent } from "@/lib/trip-events";
import { TripEventType } from "@prisma/client";

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

  const body = await req.json();
  const eventType = body?.eventType;

  if (!eventTypes.has(eventType)) {
    return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
  }

  const event = await recordTripEvent({
    tripId,
    eventType,
    actorId: session?.id,
    actorType: session?.role,
    payload: body?.payload && typeof body.payload === "object" ? body.payload : undefined,
  });

  return NextResponse.json({ event }, { status: 201 });
}
