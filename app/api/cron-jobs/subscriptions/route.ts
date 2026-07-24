import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";

function authorized(req: NextRequest) {
  if (!process.env.CRON_SECRET) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const [pastDue, nonRenewing] = await db.$transaction([
    db.subscription.updateMany({
      where: {
        status: "PAST_DUE",
        graceEndsAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    }),
    db.subscription.updateMany({
      where: {
        status: "NON_RENEWING",
        currentPeriodEnd: { lte: now },
      },
      data: { status: "CANCELLED" },
    }),
  ]);
  return NextResponse.json({
    expiredPastDue: pastDue.count,
    completedCancellations: nonRenewing.count,
  });
}
