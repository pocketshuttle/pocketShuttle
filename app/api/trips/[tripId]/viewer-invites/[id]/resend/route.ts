import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin, platformBaseUrl } from "@/lib/admin/request-security";
import { requireBillingIdentity } from "@/lib/billing/current-account";
import { sendTripViewerInviteEmail } from "@/lib/mail";
import {
  createTripViewerInviteToken,
  viewerInviteExpiry,
} from "@/lib/trip-viewer-invites";
import db from "@/packages/db/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; id: string }> }
) {
  try {
    assertSameOrigin(req);
    const { session, account } = await requireBillingIdentity();
    const { tripId, id } = await params;
    const invite = await db.tripViewerInvite.findFirst({
      where: { id, tripId, billingAccountId: account.id, status: "PENDING" },
      include: { trip: { select: { title: true } } },
    });
    if (!invite?.email) {
      return NextResponse.json({ message: "Email invitation not found" }, { status: 404 });
    }
    const { token, tokenHash } = createTripViewerInviteToken();
    const expiresAt = viewerInviteExpiry(7);
    await db.tripViewerInvite.update({
      where: { id: invite.id },
      data: { tokenHash, expiresAt, deliveryStatus: "PENDING", deliveryError: null },
    });
    try {
      await sendTripViewerInviteEmail({
        email: invite.email,
        token,
        inviterName: session.name,
        tripTitle: invite.trip.title,
        expiresAt,
      });
      await db.tripViewerInvite.update({
        where: { id: invite.id },
        data: { deliveryStatus: "SENT" },
      });
    } catch (error) {
      await db.tripViewerInvite.update({
        where: { id: invite.id },
        data: {
          deliveryStatus: "FAILED",
          deliveryError: error instanceof Error ? error.message : "Delivery failed",
        },
      });
    }
    return NextResponse.json({
      message: "Invitation resent",
      ...(process.env.NODE_ENV !== "production"
        ? { inviteUrl: `${platformBaseUrl()}/viewer/invite?token=${encodeURIComponent(token)}` }
        : {}),
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
