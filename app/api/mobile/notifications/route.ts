import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { mobileTrips } from "@/lib/mobile/dashboard";
import { mobileErrorResponse } from "@/lib/mobile/errors";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    const trips = await mobileTrips(actor);
    const notifications = [...trips.active, ...trips.recent]
      .flatMap((trip) =>
        trip.events.map((event) => ({
          id: event.id,
          tripId: trip.id,
          tripTitle: trip.title,
          type: event.eventType,
          safetyState: trip.safetyState,
          payload: event.payload,
          createdAt: event.timestamp,
        }))
      )
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
      )
      .slice(0, 100);
    return NextResponse.json({ notifications });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
