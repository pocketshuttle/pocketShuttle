import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import {
  getEntitlements,
  historyCutoff,
  requireFeature,
} from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import { canAccessTrip } from "@/lib/trip-access";
import db from "@/packages/db/client";

function csv(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const session = await getApiSession();
  const { tripId } = await params;
  if (!session || !(await canAccessTrip(tripId, session))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "downloadable_reports");
    const cutoff = historyCutoff(resolved);
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
      },
      include: {
        participants: true,
        events: {
          where: cutoff ? { timestamp: { gte: cutoff } } : undefined,
          orderBy: { timestamp: "asc" },
        },
        locations: {
          where: cutoff ? { timestamp: { gte: cutoff } } : undefined,
          orderBy: { timestamp: "asc" },
        },
      },
    });
    if (!trip) {
      return NextResponse.json(
        { message: "Trip is outside your plan history window" },
        { status: 404 }
      );
    }

    const rows = [
      ["record_type", "timestamp", "type", "latitude", "longitude", "details"],
      ...trip.events.map((event) => [
        "event",
        event.timestamp.toISOString(),
        event.eventType,
        "",
        "",
        event.payload,
      ]),
      ...trip.locations.map((location) => [
        "location",
        location.timestamp.toISOString(),
        "",
        location.lat,
        location.lng,
        { speed: location.speed, heading: location.heading, accuracy: location.accuracy },
      ]),
    ];
    const output = rows.map((row) => row.map(csv).join(",")).join("\n");
    return new NextResponse(output, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="trip-${tripId}.csv"`,
      },
    });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to export report" },
      { status: 400 }
    );
  }
}
