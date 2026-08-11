import { NextRequest, NextResponse } from "next/server";

import { isCronRequestAuthorized } from "@/lib/cron/request-auth";
import { runRecurringTripSuggestionSweep } from "@/lib/recurring-trip-suggestions";

export async function GET(req: NextRequest) {
  if (!(await isCronRequestAuthorized(req))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const result = await runRecurringTripSuggestionSweep();
  return NextResponse.json(result);
}
