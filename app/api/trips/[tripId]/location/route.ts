import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { assertRateLimit } from "@/lib/admin/request-security";
import { runDeduplicatedMobileEvent } from "@/lib/mobile/deduplication";
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
  if (session?.mobileSession) {
    try {
      assertRateLimit(`mobile-location:${session.id}`, {
        limit: 900,
        windowMs: 15 * 60 * 1000,
      });
    } catch {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Location updates are arriving too quickly." },
        { status: 429 }
      );
    }
  }

  const body = await req.json();
  const lat = body?.lat ?? body?.latitude;
  const lng = body?.lng ?? body?.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ message: "Invalid lat or lng" }, { status: 400 });
  }

  const record = () =>
    recordTripLocation({
      tripId,
      lat,
      lng,
      accuracy: typeof body?.accuracy === "number" ? body.accuracy : null,
      speed: typeof body?.speed === "number" ? body.speed : null,
      heading: typeof body?.heading === "number" ? body.heading : null,
    });
  const result =
    session?.mobileSession &&
    ["parent", "driver", "teacher"].includes(session.role)
      ? await runDeduplicatedMobileEvent({
          actor: session as typeof session & {
            role: "parent" | "driver" | "teacher";
          },
          clientEventId: body?.clientEventId,
          eventType: "trip_location",
          action: record,
        })
      : { value: await record(), duplicate: false };

  return NextResponse.json(
    { location: result.value, duplicate: result.duplicate },
    { status: result.duplicate ? 200 : 201 }
  );
}
