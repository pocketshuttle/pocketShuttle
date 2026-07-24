import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import { dispatchTripNotifications } from "@/lib/trip-notifications";
import db from "@/packages/db/client";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("notifications.manage");
    const body = await request.json();
    const eventId = String(body.eventId || "");
    const reason = String(body.reason || "").trim();
    if (!eventId || reason.length < 5) {
      return NextResponse.json(
        { message: "An event and resend reason are required" },
        { status: 400 }
      );
    }
    const event = await db.tripEvent.findUnique({
      where: { id: eventId },
      include: { trip: { select: { id: true, title: true } } },
    });
    if (!event || event.actorType === "notification_dispatch") {
      return NextResponse.json({ message: "Notification event not found" }, { status: 404 });
    }
    const payload =
      event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
        ? (event.payload as Record<string, unknown>)
        : null;
    const attempts = await dispatchTripNotifications({
      tripId: event.tripId,
      eventType: event.eventType,
      payload,
    });
    await logSuperUserAction({
      superUserId: session.id,
      action: "NOTIFICATION_RESENT",
      targetId: `trip-event:${event.id}`,
      metadata: {
        reason,
        tripId: event.tripId,
        eventType: event.eventType,
        attempts,
      },
    });
    return NextResponse.json({
      message: "Notification resend completed",
      attempts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resend notification";
    return NextResponse.json(
      { message },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "FORBIDDEN" || message === "INVALID_ORIGIN"
              ? 403
              : 400,
      }
    );
  }
}
