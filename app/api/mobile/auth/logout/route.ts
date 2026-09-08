import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { mobileErrorResponse } from "@/lib/mobile/errors";
import db from "@/packages/db/client";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    await db.mobileSession.update({
      where: { id: actor.mobileSessionId },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ message: "Signed out" });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
