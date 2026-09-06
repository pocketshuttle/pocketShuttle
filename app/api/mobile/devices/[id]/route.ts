import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";
import db from "@/packages/db/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireMobileActor(request);
    const { id } = await params;
    const device = await db.mobileDevice.findFirst({
      where: {
        id,
        subjectRole: actor.role.toUpperCase() as "PARENT" | "DRIVER" | "TEACHER",
        subjectId: actor.id,
      },
      select: { id: true },
    });
    if (!device) {
      throw new MobileApiError("NOT_FOUND", 404, "Device not found.");
    }
    const now = new Date();
    await db.$transaction([
      db.mobileDevice.update({
        where: { id },
        data: {
          revokedAt: now,
          oneSignalSubscriptionId: null,
        },
      }),
      db.mobileSession.updateMany({
        where: { deviceId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    return NextResponse.json({ message: "Device access revoked" });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
