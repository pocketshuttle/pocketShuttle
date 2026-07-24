import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import db from "@/packages/db/client";

const actions = new Set([
  "PAUSE",
  "RESUME",
  "CANCEL",
  "COMPLETE",
  "RESOLVE_EMERGENCY",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("operations.manage");
    const { id } = await params;
    const body = await request.json();
    const action = String(body.action || "").toUpperCase();
    const reason = String(body.reason || "").trim();
    if (!actions.has(action) || reason.length < 5) {
      return NextResponse.json(
        { message: "A valid action and correction reason are required" },
        { status: 400 }
      );
    }
    const trip = await db.trip.findUnique({ where: { id } });
    if (!trip) return NextResponse.json({ message: "Trip not found" }, { status: 404 });

    const transition = {
      PAUSE: { allowed: ["active"], status: "paused", eventType: "trip_paused" },
      RESUME: { allowed: ["paused"], status: "active", eventType: "trip_started" },
      CANCEL: {
        allowed: ["scheduled", "active", "paused", "emergency"],
        status: "cancelled",
        eventType: "trip_ended",
      },
      COMPLETE: {
        allowed: ["active", "paused"],
        status: "completed",
        eventType: "trip_ended",
      },
      RESOLVE_EMERGENCY: {
        allowed: ["emergency", "active", "paused"],
        status: trip.status === "emergency" ? "active" : trip.status,
        eventType: "emergency_resolved",
      },
    }[action]!;
    if (!transition.allowed.includes(trip.status)) {
      return NextResponse.json(
        { message: `${action.toLowerCase()} is not valid for a ${trip.status} trip` },
        { status: 409 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.trip.update({
        where: { id },
        data: {
          status: transition.status as any,
          ...(action === "RESOLVE_EMERGENCY" ? { safetyState: "normal" } : {}),
          ...(["CANCEL", "COMPLETE"].includes(action) ? { endedAt: new Date() } : {}),
        },
      });
      await tx.tripEvent.create({
        data: {
          tripId: id,
          eventType: transition.eventType as any,
          actorId: session.id,
          actorType: "platform_admin",
          payload: {
            source: "platform_admin_correction",
            action,
            reason,
            previousStatus: trip.status,
          },
        },
      });
      return result;
    });
    await logSuperUserAction({
      superUserId: session.id,
      action: `TRIP_${action}`,
      targetId: `trip:${id}`,
      metadata: {
        reason,
        before: { status: trip.status, safetyState: trip.safetyState },
        after: { status: updated.status, safetyState: updated.safetyState },
      },
    });
    return NextResponse.json({ message: "Trip updated", trip: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update trip";
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
