import { NextRequest, NextResponse } from "next/server";

import { isCronRequestAuthorized } from "@/lib/cron/request-auth";
import db from "@/packages/db/client";

export async function GET(request: NextRequest) {
  if (!(await isCronRequestAuthorized(request))) {
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
