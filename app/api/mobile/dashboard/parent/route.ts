import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { parentMobileDashboard } from "@/lib/mobile/dashboard";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    if (actor.role !== "parent") {
      throw new MobileApiError("FORBIDDEN", 403, "Parent access required.");
    }
    return NextResponse.json(await parentMobileDashboard(actor));
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
