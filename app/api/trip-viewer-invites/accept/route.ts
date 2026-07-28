import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { getApiSession } from "@/lib/api-auth";
import { hashTripViewerInviteToken } from "@/lib/trip-viewer-invites";
import db from "@/packages/db/client";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const session = await getApiSession();
  if (!session || !["parent", "teacher", "driver"].includes(session.role)) {
    return NextResponse.json(
      { code: "LOGIN_REQUIRED", message: "Sign in with the invited account to continue" },
      { status: 401 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");
  const invite = token
    ? await db.tripViewerInvite.findUnique({ where: { tokenHash: hashTripViewerInviteToken(token) } })
    : null;
  if (!invite || invite.status !== "PENDING" || invite.expiresAt <= new Date()) {
    return NextResponse.json({ message: "This invitation is unavailable or expired" }, { status: 410 });
  }
  if (invite.email && session.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json({ message: "Sign in with the invited email address" }, { status: 403 });
  }
  await db.$transaction([
    db.tripViewer.upsert({
      where: {
        tripId_viewerType_viewerId: {
          tripId: invite.tripId,
          viewerType: session.role,
          viewerId: session.id,
        },
      },
      create: {
        tripId: invite.tripId,
        viewerType: session.role,
        viewerId: session.id,
        permissions: ["view_location", "view_events", "receive_alerts"],
        expiresAt: invite.expiresAt,
        metadata: { inviteId: invite.id, emergencyContact: invite.emergencyContact },
      },
      update: {
        permissions: ["view_location", "view_events", "receive_alerts"],
        expiresAt: invite.expiresAt,
      },
    }),
    db.tripViewerInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedViewerId: session.id,
        acceptedViewerType: session.role,
      },
    }),
  ]);
  return NextResponse.json({ message: "Invitation accepted", tripId: invite.tripId });
}
