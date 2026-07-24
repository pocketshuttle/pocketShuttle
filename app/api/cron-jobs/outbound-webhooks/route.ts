import { NextRequest, NextResponse } from "next/server";

import { deliverPendingWebhooks } from "@/lib/enterprise/webhooks";

export async function GET(req: NextRequest) {
  const authorized =
    process.env.CRON_SECRET
      ? req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
      : process.env.NODE_ENV !== "production";
  if (!authorized) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const processed = await deliverPendingWebhooks();
  return NextResponse.json({ processed });
}
