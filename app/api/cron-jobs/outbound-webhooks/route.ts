import { NextRequest, NextResponse } from "next/server";

import { isCronRequestAuthorized } from "@/lib/cron/request-auth";
import { deliverPendingWebhooks } from "@/lib/enterprise/webhooks";

export async function GET(req: NextRequest) {
  if (!(await isCronRequestAuthorized(req))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const processed = await deliverPendingWebhooks();
  return NextResponse.json({ processed });
}
