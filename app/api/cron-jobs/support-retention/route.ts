import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";

function authorized(request: NextRequest) {
  if (!process.env.CRON_SECRET) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const deleted = await db.$executeRaw`
    DELETE FROM "support_tickets"
    WHERE "deleted_at" IS NOT NULL
      AND "deleted_at" < NOW() - INTERVAL '21 days'
  `;
  return NextResponse.json({
    deleted: Number(deleted),
    retentionDays: 21,
    completedAt: new Date().toISOString(),
  });
}
