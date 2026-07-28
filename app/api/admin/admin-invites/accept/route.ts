import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import {
  assertRateLimit,
  assertSameOrigin,
  hashAdminInviteToken,
  platformAdminInviteAcceptanceState,
} from "@/lib/admin/request-security";
import db from "@/packages/db/client";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (token.length < 32 || password.length < 12) {
      return NextResponse.json(
        { message: "A valid invitation and a 12-character password are required" },
        { status: 400 }
      );
    }
    assertRateLimit(`admin-invite-accept:${hashAdminInviteToken(token)}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    const tokenHash = hashAdminInviteToken(token);
    const invite = await db.platformAdminInvite.findUnique({
      where: { tokenHash },
    });
    if (!invite) {
      return NextResponse.json({ message: "Invitation is invalid or has been used" }, { status: 400 });
    }
    const acceptanceState = platformAdminInviteAcceptanceState(invite);
    if (acceptanceState === "UNAVAILABLE") {
      return NextResponse.json({ message: "Invitation is invalid or has been used" }, { status: 400 });
    }
    if (acceptanceState === "EXPIRED") {
      await db.platformAdminInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ message: "Invitation has expired" }, { status: 410 });
    }
    if (await db.superUser.findUnique({ where: { email: invite.email } })) {
      return NextResponse.json({ message: "An admin already uses this email" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await db.$transaction(async (tx) => {
      const created = await tx.superUser.create({
        data: {
          name: invite.name,
          email: invite.email,
          password: passwordHash,
          role: "SUPERADMIN",
          accessRole: invite.accessRole,
          invitedById: invite.invitedById,
        },
      });
      await tx.platformAdminInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedById: created.id,
          tokenHash: `accepted:${invite.id}:${Date.now()}`,
        },
      });
      await tx.superUserAction.create({
        data: {
          superUserId: created.id,
          action: "PLATFORM_ADMIN_INVITE_ACCEPTED",
          targetId: `superadmin:${created.id}`,
          metadata: { invitedById: invite.invitedById, accessRole: invite.accessRole },
        },
      });
      return created;
    });

    return NextResponse.json({
      message: "Admin account created. You can now sign in.",
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to accept invitation";
    return NextResponse.json(
      { message },
      {
        status:
          message === "INVALID_ORIGIN"
            ? 403
            : message === "RATE_LIMITED"
              ? 429
              : 400,
      }
    );
  }
}
