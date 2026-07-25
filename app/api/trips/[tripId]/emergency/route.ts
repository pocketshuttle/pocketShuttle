import { NextRequest, NextResponse } from "next/server";

import { assertRateLimit } from "@/lib/admin/request-security";
import { getApiSession } from "@/lib/api-auth";
import { runDeduplicatedMobileEvent } from "@/lib/mobile/deduplication";
import { canAccessTrip } from "@/lib/trip-access";
import { recordTripEvent } from "@/lib/trip-events";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const session = await getApiSession();
  if (!session || !(await canAccessTrip(tripId, session))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const resolve = body?.resolve === true;
  if (
    resolve &&
    !["admin", "school", "teacher", "driver"].includes(session.role)
  ) {
    return NextResponse.json(
      { message: "Only trip operators can resolve an emergency." },
      { status: 403 }
    );
  }
  if (session.mobileSession) {
    try {
      assertRateLimit(`mobile-emergency:${session.id}`, {
        limit: 10,
        windowMs: 15 * 60 * 1000,
      });
    } catch {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many emergency requests." },
        { status: 429 }
      );
    }
  }
  const eventType = resolve ? "emergency_resolved" : "emergency_triggered";
  const createEvent = () =>
    recordTripEvent({
      tripId,
      eventType,
      actorId: session.id,
      actorType: session.role,
      status: resolve ? "active" : "emergency",
      safetyState: resolve ? "normal" : "emergency",
      payload: {
        source: session.mobileSession ? "mobile" : "web",
        note:
          typeof body.note === "string" ? body.note.trim().slice(0, 500) : null,
      },
    });
  const result =
    session.mobileSession &&
    ["parent", "driver", "teacher"].includes(session.role)
      ? await runDeduplicatedMobileEvent({
          actor: session as typeof session & {
            role: "parent" | "driver" | "teacher";
          },
          clientEventId: body.clientEventId,
          eventType,
          action: createEvent,
        })
      : { value: await createEvent(), duplicate: false };

  return NextResponse.json({
    message: resolve ? "Emergency resolved" : "Emergency activated",
    event: result.value,
    duplicate: result.duplicate,
  });
}
