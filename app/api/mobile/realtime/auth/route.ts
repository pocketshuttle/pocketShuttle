import { NextRequest, NextResponse } from "next/server";

import { canAccessTrip } from "@/lib/trip-access";
import { requireMobileActor } from "@/lib/mobile/auth";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";
import { getPusherInstance } from "@/pusher/server";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    const body = await request.json().catch(() => ({}));
    const socketId = String(body.socketId || body.socket_id || "");
    const channelName = String(body.channelName || body.channel_name || "");
    if (!socketId || !channelName.startsWith("private-")) {
      throw new MobileApiError(
        "INVALID_REQUEST",
        400,
        "Socket and private channel are required."
      );
    }
    const parentChannel =
      actor.role === "parent" &&
      channelName === `private-known-driver-parent-${actor.id}`;
    const driverChannel =
      actor.role === "driver" &&
      channelName === `private-known-driver-driver-${actor.id}`;
    const tripMatch = /^private-trip-(.+)$/.exec(channelName);
    const tripChannel =
      Boolean(tripMatch?.[1]) &&
      (await canAccessTrip(tripMatch![1], {
        id: actor.id,
        role: actor.role,
        schoolId: actor.schoolId,
      }));
    if (!parentChannel && !driverChannel && !tripChannel) {
      throw new MobileApiError("FORBIDDEN", 403, "Channel access denied.");
    }
    return NextResponse.json(
      getPusherInstance().authorizeChannel(socketId, channelName)
    );
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
