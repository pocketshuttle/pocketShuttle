import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";
import db from "@/packages/db/client";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    const devices = await db.mobileDevice.findMany({
      where: {
        subjectRole: actor.role.toUpperCase() as "PARENT" | "DRIVER" | "TEACHER",
        subjectId: actor.id,
      },
      select: {
        id: true,
        platform: true,
        name: true,
        appVersion: true,
        lastSeenAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { lastSeenAt: "desc" },
    });
    return NextResponse.json({ devices, currentDeviceId: actor.mobileDeviceId });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    const body = await request.json().catch(() => ({}));
    const subscriptionId = String(body.oneSignalSubscriptionId || "").trim();
    if (subscriptionId.length < 8 || subscriptionId.length > 300) {
      throw new MobileApiError(
        "INVALID_REQUEST",
        400,
        "A valid notification subscription is required."
      );
    }
    const device = await db.mobileDevice.update({
      where: { id: actor.mobileDeviceId },
      data: {
        oneSignalSubscriptionId: subscriptionId,
        appVersion:
          typeof body.appVersion === "string"
            ? body.appVersion.trim().slice(0, 40)
            : undefined,
        lastSeenAt: new Date(),
      },
      select: { id: true, platform: true, lastSeenAt: true },
    });
    return NextResponse.json({ device });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
