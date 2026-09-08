import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { driverMobileDashboard } from "@/lib/mobile/dashboard";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    if (actor.role !== "driver") {
      throw new MobileApiError("FORBIDDEN", 403, "Driver access required.");
    }
    return NextResponse.json(await driverMobileDashboard(actor));
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
