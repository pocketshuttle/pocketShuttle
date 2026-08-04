import { NextRequest, NextResponse } from "next/server";

import { canInvitePlatformRole } from "@/lib/admin/permissions";
import {
  adminInviteExpiresAt,
  assertRateLimit,
  assertSameOrigin,
  createAdminInviteToken,
  platformBaseUrl,
} from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import { sendPlatformAdminInviteEmail } from "@/lib/mail";
import db from "@/packages/db/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("admins.invite");
    const { id } = await params;
    const invite = await db.platformAdminInvite.findUnique({ where: { id } });
    if (!invite || invite.status === "ACCEPTED" || invite.status === "REVOKED") {
      return NextResponse.json({ message: "Invitation cannot be resent" }, { status: 404 });
    }
    if (
      !session.platformAccessRole ||
      !canInvitePlatformRole(session.platformAccessRole, invite.accessRole)
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    await assertRateLimit(`admin-invite-resend:${session.id}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    const { token, tokenHash } = createAdminInviteToken();
    const updated = await db.platformAdminInvite.update({
      where: { id },
      data: {
        tokenHash,
        status: "PENDING",
        deliveryStatus: "PENDING",
        deliveryError: null,
        expiresAt: adminInviteExpiresAt(),
        revokedAt: null,
      },
    });

    let deliveryWarning: string | null = null;
    try {
      await sendPlatformAdminInviteEmail({
        email: updated.email,
        token,
        inviterName: session.name,
        role: updated.accessRole,
      });
      await db.platformAdminInvite.update({
        where: { id },
        data: { deliveryStatus: "SENT" },
      });
    } catch (error) {
      deliveryWarning =
        error instanceof Error ? error.message : "Invitation delivery failed";
      await db.platformAdminInvite.update({
        where: { id },
        data: {
          deliveryStatus: "FAILED",
          deliveryError: deliveryWarning.slice(0, 500),
        },
      });
    }

    await logSuperUserAction({
      superUserId: session.id,
      action: "PLATFORM_ADMIN_INVITE_RESENT",
      targetId: `admin-invite:${id}`,
      metadata: { email: updated.email, deliveryWarning },
    });

    return NextResponse.json({
      message: deliveryWarning
        ? "Invitation renewed, but email delivery failed"
        : "Invitation resent",
      ...(process.env.NODE_ENV !== "production"
        ? {
            inviteUrl: `${platformBaseUrl()}/admin/invite?token=${encodeURIComponent(token)}`,
          }
        : {}),
      deliveryWarning,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resend";
    return NextResponse.json(
      { message },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "FORBIDDEN" || message === "INVALID_ORIGIN"
              ? 403
              : message === "RATE_LIMITED"
                ? 429
                : 400,
      }
    );
  }
}
