import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import {
  hasPlatformPermission,
  isPlatformAdminRole,
  wouldRemoveLastPlatformOwner,
} from "@/lib/admin/permissions";
import { assertSameOrigin } from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("admins.manage");
    const { id } = await params;
    const body = await request.json();
    const target = await db.superUser.findUnique({ where: { id } });
    const actor = await db.superUser.findUnique({ where: { id: session.id } });
    if (!target || !actor || !session.platformAccessRole) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    const nextRole =
      body.accessRole === undefined
        ? target.accessRole
        : String(body.accessRole).toUpperCase();
    const nextStatus =
      body.status === undefined ? target.status : String(body.status).toUpperCase();
    if (
      !isPlatformAdminRole(nextRole) ||
      !["ACTIVE", "DISABLED"].includes(nextStatus)
    ) {
      return NextResponse.json({ message: "Invalid role or status" }, { status: 400 });
    }
    const ownerChange = target.accessRole === "OWNER" || nextRole === "OWNER";
    if (
      ownerChange &&
      !hasPlatformPermission(session.platformAccessRole, "admins.manage_owner")
    ) {
      return NextResponse.json({ message: "Only an owner can manage owners" }, { status: 403 });
    }
    if (id === session.id && nextStatus === "DISABLED") {
      return NextResponse.json({ message: "You cannot disable your own account" }, { status: 400 });
    }
    if (target.accessRole === "OWNER") {
      const activeOwners = await db.superUser.count({
        where: { accessRole: "OWNER", status: "ACTIVE" },
      });
      if (
        wouldRemoveLastPlatformOwner({
          targetRole: target.accessRole,
          nextRole,
          nextStatus: nextStatus as "ACTIVE" | "DISABLED",
          activeOwnerCount: activeOwners,
        })
      ) {
        return NextResponse.json(
          { message: "At least one active owner is required" },
          { status: 409 }
        );
      }
    }

    const sensitiveChange =
      nextRole !== target.accessRole || nextStatus !== target.status;
    if (sensitiveChange) {
      const currentPassword = String(body.currentPassword || "");
      if (!currentPassword || !(await bcrypt.compare(currentPassword, actor.password))) {
        return NextResponse.json(
          { message: "Your current password is required for this change" },
          { status: 403 }
        );
      }
    }

    const updated = await db.superUser.update({
      where: { id },
      data: {
        accessRole: nextRole,
        status: nextStatus as "ACTIVE" | "DISABLED",
        disabledAt: nextStatus === "DISABLED" ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        accessRole: true,
        status: true,
        disabledAt: true,
        lastLoginAt: true,
      },
    });
    if (nextStatus === "DISABLED") {
      await db.platformAdminWorkspaceSession.updateMany({
        where: { superUserId: id, endedAt: null },
        data: { endedAt: new Date() },
      });
    }
    await logSuperUserAction({
      superUserId: session.id,
      action: "PLATFORM_ADMIN_UPDATED",
      targetId: `superadmin:${id}`,
      metadata: {
        before: { accessRole: target.accessRole, status: target.status },
        after: { accessRole: updated.accessRole, status: updated.status },
      },
    });
    return NextResponse.json({ message: "Admin updated", admin: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update admin";
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
