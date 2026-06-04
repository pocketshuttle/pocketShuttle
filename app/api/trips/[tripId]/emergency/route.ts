import { NextRequest, NextResponse } from "next/server";

import {
  resolveTripEmergency,
  triggerTripEmergency,
} from "@/actions/trip-safety";

export async function POST(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const resolve = body?.resolve === true;

  const result = resolve
    ? await resolveTripEmergency({ tripId: params.tripId, note: body?.note })
    : await triggerTripEmergency({ tripId: params.tripId, note: body?.note });

  return NextResponse.json(result, { status: result.status });
}
