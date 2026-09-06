import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { teacherMobileDashboard } from "@/lib/mobile/dashboard";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireMobileActor(request);
    if (actor.role !== "teacher") {
      throw new MobileApiError("FORBIDDEN", 403, "Teacher access required.");
    }
    return NextResponse.json(await teacherMobileDashboard(actor));
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
