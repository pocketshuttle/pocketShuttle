import { NextRequest, NextResponse } from "next/server";

import { requireMobileActor } from "@/lib/mobile/auth";
import { mobileTrips } from "@/lib/mobile/dashboard";
import { MobileApiError, mobileErrorResponse } from "@/lib/mobile/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireMobileActor(request);
    const { id } = await params;
    const trips = await mobileTrips(actor);
    const trip = [...trips.active, ...trips.recent].find(
      (candidate) => candidate.id === id
    );
    if (!trip) {
      throw new MobileApiError(
        "NOT_FOUND",
        404,
        "Trip not found or outside your visible history."
      );
    }
    return NextResponse.json({
      trip,
      historyCutoff: trips.historyCutoff,
      plan: trips.plan,
    });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
