import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import {
  assertWithinLimit,
  getEntitlements,
  requireFeature,
} from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import { canAccessTrip } from "@/lib/trip-access";
import db from "@/packages/db/client";

type Params = { tripId: string };

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  const { tripId } = await params;
  if (!(await canAccessTrip(tripId, session))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const viewers = await db.tripViewer.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ viewers });
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  const { tripId } = await params;
  if (!session || !(await canAccessTrip(tripId, session))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "multiple_viewers");
    const current = await db.tripViewer.count({
      where: {
        tripId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    assertWithinLimit(resolved, "max_viewers", current);
    const body = await req.json().catch(() => ({}));
    const viewerId = String(body.viewerId || "");
    const viewerType = String(body.viewerType || "guest");
    if (!viewerId) return NextResponse.json({ message: "viewerId is required" }, { status: 400 });
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ message: "Invalid expiresAt" }, { status: 400 });
    }
    const viewer = await db.tripViewer.upsert({
      where: { tripId_viewerType_viewerId: { tripId, viewerType, viewerId } },
      create: {
        tripId,
        viewerId,
        viewerType,
        expiresAt,
        permissions: ["view_location", "view_events", "receive_alerts"],
        metadata: { source: "subscription_viewer", addedBy: session.id },
      },
      update: {
        expiresAt,
        permissions: ["view_location", "view_events", "receive_alerts"],
      },
    });
    return NextResponse.json({ message: "Viewer added", viewer }, { status: 201 });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to add viewer" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  const { tripId } = await params;
  if (!session || !(await canAccessTrip(tripId, session))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const viewerId = req.nextUrl.searchParams.get("viewerId");
  const viewerType = req.nextUrl.searchParams.get("viewerType") || "guest";
  if (!viewerId) return NextResponse.json({ message: "viewerId is required" }, { status: 400 });
  await db.tripViewer.deleteMany({ where: { tripId, viewerId, viewerType } });
  return NextResponse.json({ message: "Viewer revoked" });
}
