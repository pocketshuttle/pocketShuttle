import { NextResponse } from "next/server";

import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformPermission("admins.read");
    const [admins, invites] = await Promise.all([
      db.superUser.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          accessRole: true,
          status: true,
          lastLoginAt: true,
          disabledAt: true,
          createdAt: true,
          invitedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      }),
      db.platformAdminInvite.findMany({
        where: { status: { in: ["PENDING", "EXPIRED"] } },
        select: {
          id: true,
          name: true,
          email: true,
          accessRole: true,
          status: true,
          deliveryStatus: true,
          deliveryError: true,
          expiresAt: true,
          createdAt: true,
          invitedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return NextResponse.json({ admins, invites });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json(
      { message: forbidden ? "Forbidden" : "Unauthorized" },
      { status: forbidden ? 403 : 401 }
    );
  }
}
