import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { logSuperUserAction } from "@/lib/admin/platform";
import { getApiSession } from "@/lib/api-auth";
import { deleteSessionCookie, setSessionCookie } from "@/lib/create-session";
import db from "@/packages/db/client";

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await getApiSession();
    const actor = session?.platformActor;
    if (!session || !actor) {
      await deleteSessionCookie();
      return NextResponse.json({ message: "Managed workspace is no longer active" });
    }
    const admin = await db.superUser.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        name: true,
        email: true,
        accessRole: true,
        status: true,
      },
    });
    if (!admin || admin.status !== "ACTIVE") {
      await deleteSessionCookie();
      return NextResponse.json({ message: "Admin access is disabled" }, { status: 401 });
    }
    await db.platformAdminWorkspaceSession.update({
      where: { id: actor.workspaceSessionId },
      data: { endedAt: new Date() },
    });
    await logSuperUserAction({
      superUserId: admin.id,
      workspaceSessionId: actor.workspaceSessionId,
      action: "MANAGED_WORKSPACE_CLOSED",
      targetId: `${session.role}:${session.id}`,
      metadata: { subjectName: session.name || null },
    });
    await setSessionCookie({
      id: admin.id,
      role: "superadmin",
      name: admin.name,
      email: admin.email,
      schoolId: null,
      platformAccessRole: admin.accessRole,
    });
    return NextResponse.json({ message: "Returned to platform admin", redirectUrl: "/admin/users" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to close workspace";
    return NextResponse.json(
      { message },
      { status: message === "INVALID_ORIGIN" ? 403 : 400 }
    );
  }
}
