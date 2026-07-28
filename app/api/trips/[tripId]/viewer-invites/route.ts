import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin, platformBaseUrl } from "@/lib/admin/request-security";
import { requireBillingIdentity } from "@/lib/billing/current-account";
import {
  assertWithinLimit,
  getEntitlements,
  requireFeature,
} from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import { sendTripViewerInviteEmail } from "@/lib/mail";
import {
  createTripViewerInviteToken,
  viewerInviteExpiry,
} from "@/lib/trip-viewer-invites";
import db from "@/packages/db/client";

async function ownedFamilyTrip(tripId: string, parentId: string | null) {
  if (!parentId) return null;
  return db.trip.findFirst({
    where: { id: tripId, createdBy: parentId, schoolId: null },
    select: { id: true, title: true },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { account } = await requireBillingIdentity();
    const { tripId } = await params;
    const trip = await ownedFamilyTrip(tripId, account.parentId);
    if (!trip) return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    const invites = await db.tripViewerInvite.findMany({
      where: { tripId, billingAccountId: account.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invites });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    assertSameOrigin(req);
    const { session, account } = await requireBillingIdentity();
    const { tripId } = await params;
    const trip = await ownedFamilyTrip(tripId, account.parentId);
    if (!trip) return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "multiple_viewers");
    const [viewerCount, inviteCount] = await Promise.all([
      db.tripViewer.count({
        where: { tripId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      }),
      db.tripViewerInvite.count({
        where: { tripId, status: "PENDING", expiresAt: { gt: new Date() } },
      }),
    ]);
    assertWithinLimit(resolved, "max_viewers", viewerCount + inviteCount);
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const phoneNumber = body.phoneNumber ? String(body.phoneNumber).trim() : null;
    if (!name || (!email && !phoneNumber)) {
      return NextResponse.json(
        { message: "Name and an email or phone number are required" },
        { status: 400 }
      );
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: "Enter a valid email" }, { status: 400 });
    }
    const { token, tokenHash } = createTripViewerInviteToken();
    const expiresAt = viewerInviteExpiry(Number(body.expiresInDays || 7));
    const invite = await db.tripViewerInvite.create({
      data: {
        billingAccountId: account.id,
        tripId,
        invitedBy: session.id,
        name,
        email,
        phoneNumber,
        tokenHash,
        emergencyContact: body.emergencyContact === true,
        expiresAt,
      },
    });
    if (email) {
      try {
        await sendTripViewerInviteEmail({
          email,
          token,
          inviterName: session.name,
          tripTitle: trip.title,
          expiresAt,
        });
        await db.tripViewerInvite.update({
          where: { id: invite.id },
          data: { deliveryStatus: "SENT", deliveryError: null },
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
    }
    return NextResponse.json(
      {
        message: "Viewer invitation created",
        invite: { ...invite, tokenHash: undefined },
        ...(process.env.NODE_ENV !== "production"
          ? { inviteUrl: `${platformBaseUrl()}/viewer/invite?token=${encodeURIComponent(token)}` }
          : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create invitation" },
      { status: 400 }
    );
  }
}
