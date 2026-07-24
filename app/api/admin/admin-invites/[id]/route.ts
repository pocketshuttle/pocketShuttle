import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("admins.invite");
    const { id } = await params;
    const invite = await db.platformAdminInvite.findUnique({ where: { id } });
    if (!invite || invite.status === "ACCEPTED") {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }
    await db.platformAdminInvite.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        tokenHash: createRevokedTokenHash(id),
      },
    });
    await logSuperUserAction({
      superUserId: session.id,
      action: "PLATFORM_ADMIN_INVITE_REVOKED",
      targetId: `admin-invite:${id}`,
      metadata: { email: invite.email, accessRole: invite.accessRole },
    });
    return NextResponse.json({ message: "Invitation revoked" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to revoke";
    return NextResponse.json(
      { message },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "FORBIDDEN" || message === "INVALID_ORIGIN"
              ? 403
              : 400,
      }
    );
  }
}

function createRevokedTokenHash(id: string) {
  return `revoked:${id}:${Date.now()}`;
}
