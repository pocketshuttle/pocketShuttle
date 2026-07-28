import { NextRequest, NextResponse } from "next/server";

import { isCronRequestAuthorized } from "@/lib/cron/request-auth";
import db from "@/packages/db/client";

export async function GET(req: NextRequest) {
  if (!(await isCronRequestAuthorized(req))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const templates = await db.tripTemplate.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    take: 100,
  });

  let created = 0;
  for (const template of templates) {
    const schedule =
      template.schedule && typeof template.schedule === "object" && !Array.isArray(template.schedule)
        ? (template.schedule as Record<string, unknown>)
        : {};
    const frequency = schedule.frequency === "WEEKLY" ? "WEEKLY" : "DAILY";
    const nextRunAt = new Date(template.nextRunAt || now);
    nextRunAt.setUTCDate(nextRunAt.getUTCDate() + (frequency === "WEEKLY" ? 7 : 1));

    await db.$transaction([
      db.trip.create({
        data: {
          tripType: template.tripType,
          title: template.title,
          status: "scheduled",
          origin: template.origin ?? undefined,
          destination: template.destination ?? undefined,
          createdBy: template.createdBy,
          metadata: {
            source: "recurring_template",
            templateId: template.id,
            ...(template.metadata && typeof template.metadata === "object" && !Array.isArray(template.metadata)
              ? template.metadata
              : {}),
          },
        },
      }),
      db.tripTemplate.update({
        where: { id: template.id },
        data: { lastGeneratedAt: now, nextRunAt },
      }),
    ]);
    created += 1;
  }
  return NextResponse.json({ processed: templates.length, created });
}
