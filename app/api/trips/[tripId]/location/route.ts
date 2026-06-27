import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { canAccessTrip } from "@/lib/trip-access";
import { recordTripLocation } from "@/lib/trip-events";

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
  const lat = body?.lat ?? body?.latitude;
  const lng = body?.lng ?? body?.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ message: "Invalid lat or lng" }, { status: 400 });
  }

  const location = await recordTripLocation({
    tripId,
    lat,
    lng,
    accuracy: typeof body?.accuracy === "number" ? body.accuracy : null,
    speed: typeof body?.speed === "number" ? body.speed : null,
    heading: typeof body?.heading === "number" ? body.heading : null,
  });

  return NextResponse.json({ location }, { status: 201 });
}
