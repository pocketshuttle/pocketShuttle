import { NextRequest, NextResponse } from "next/server";

import {
  canInvitePlatformRole,
  isPlatformAdminRole,
} from "@/lib/admin/permissions";
import {
  adminInviteExpiresAt,
  assertRateLimit,
  assertSameOrigin,
  createAdminInviteToken,
  normalizeAdminEmail,
  platformBaseUrl,
} from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import { sendPlatformAdminInviteEmail } from "@/lib/mail";
import db from "@/packages/db/client";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("admins.invite");
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = normalizeAdminEmail(body.email);
    const accessRole = String(body.accessRole || "ADMIN").toUpperCase();

    if (name.length < 2 || !email.includes("@") || !isPlatformAdminRole(accessRole)) {
      return NextResponse.json(
        { message: "A valid name, email, and role are required" },
        { status: 400 }
      );
    }
    if (
      !session.platformAccessRole ||
      !canInvitePlatformRole(session.platformAccessRole, accessRole)
    ) {
      return NextResponse.json(
        { message: "You cannot invite this admin role" },
        { status: 403 }
      );
    }
    await assertRateLimit(`admin-invite:${session.id}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    const [existingAdmin, existingInvite] = await Promise.all([
      db.superUser.findUnique({ where: { email }, select: { id: true } }),
      db.platformAdminInvite.findFirst({
        where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
        select: { id: true },
      }),
    ]);
    if (existingAdmin || existingInvite) {
      return NextResponse.json(
        { message: "An active admin or pending invitation already uses this email" },
        { status: 409 }
      );
    }

    await db.platformAdminInvite.updateMany({
      where: { email, status: "PENDING", expiresAt: { lte: new Date() } },
      data: { status: "EXPIRED" },
    });

    const { token, tokenHash } = createAdminInviteToken();
    const invite = await db.platformAdminInvite.create({
      data: {
        name,
        email,
        accessRole,
        tokenHash,
        invitedById: session.id,
        expiresAt: adminInviteExpiresAt(),
      },
    });

    let deliveryWarning: string | null = null;
    try {
      await sendPlatformAdminInviteEmail({
        email,
        token,
        inviterName: session.name,
        role: accessRole,
      });
      await db.platformAdminInvite.update({
        where: { id: invite.id },
        data: { deliveryStatus: "SENT", deliveryError: null },
      });
    } catch (error) {
      deliveryWarning =
        error instanceof Error ? error.message : "Invitation delivery failed";
      await db.platformAdminInvite.update({
        where: { id: invite.id },
        data: {
          deliveryStatus: "FAILED",
          deliveryError: deliveryWarning.slice(0, 500),
        },
      });
    }

    await logSuperUserAction({
      superUserId: session.id,
      action: "PLATFORM_ADMIN_INVITED",
      targetId: `admin-invite:${invite.id}`,
      metadata: { email, accessRole, deliveryWarning },
    });

    return NextResponse.json(
      {
        message: deliveryWarning
          ? "Invitation created, but email delivery failed. You can retry it."
          : "Admin invitation sent",
        invite: {
          id: invite.id,
          name,
          email,
          accessRole,
          expiresAt: invite.expiresAt,
        },
        ...(process.env.NODE_ENV !== "production"
          ? {
              inviteUrl: `${platformBaseUrl()}/admin/invite?token=${encodeURIComponent(token)}`,
            }
          : {}),
        deliveryWarning,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to invite admin";
    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : message === "RATE_LIMITED"
            ? 429
            : message === "INVALID_ORIGIN"
              ? 403
              : 400;
    return NextResponse.json({ message }, { status });
  }
}
