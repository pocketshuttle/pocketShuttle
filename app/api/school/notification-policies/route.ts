import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { canManageSchool, getApiSession } from "@/lib/api-auth";
import { getEntitlements, requireFeature } from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

const eventTypes = [
  "trip_started",
  "participant_boarded",
  "participant_dropped",
  "eta_updated",
  "route_deviation",
  "unusual_stop",
  "emergency_triggered",
] as const;
const channels = ["PUSH", "SMS", "WHATSAPP"] as const;

export async function GET() {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const policies = await db.schoolNotificationPolicy.findMany({
    where: { schoolId },
    orderBy: [{ eventType: "asc" }, { channel: "asc" }],
  });
  return NextResponse.json({ policies, eventTypes, channels });
}

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    requireFeature(await getEntitlements(session), "parent_notification_automation");
    const body = await req.json().catch(() => ({}));
    const eventType = String(body.eventType || "") as (typeof eventTypes)[number];
    const channel = String(body.channel || "").toUpperCase() as (typeof channels)[number];
    if (!eventTypes.includes(eventType) || !channels.includes(channel)) {
      return NextResponse.json({ message: "Invalid event type or channel" }, { status: 400 });
    }
    const policy = await db.schoolNotificationPolicy.upsert({
      where: { schoolId_eventType_channel: { schoolId, eventType, channel } },
      create: {
        schoolId,
        eventType,
        channel,
        enabled: body.enabled !== false,
        settings: body.settings && typeof body.settings === "object" ? body.settings : {},
      },
      update: {
        enabled: body.enabled !== false,
        settings: body.settings && typeof body.settings === "object" ? body.settings : {},
      },
    });
    return NextResponse.json({ message: "Notification policy updated", policy });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json({ message: "Unable to update notification policy" }, { status: 400 });
  }
}
