import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { mobileErrorResponse } from "@/lib/mobile/errors";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    return NextResponse.json({
      user: {
        id: actor.id,
        role: actor.role,
        name: actor.name,
        email: actor.email,
        image: actor.image,
        schoolId: actor.schoolId,
      },
      deviceId: actor.mobileDeviceId,
    });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
