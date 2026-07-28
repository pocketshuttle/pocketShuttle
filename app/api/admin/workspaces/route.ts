import {
  PlatformAdminSubjectType,
  PlatformAdminWorkspaceReason,
  Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  hasPlatformPermission,
  isPlatformAdminRole,
} from "@/lib/admin/permissions";
import { assertSameOrigin, sanitizeAuditValue } from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformAdmin,
} from "@/lib/admin/platform";
import { resolveManagedWorkspaceSubject } from "@/lib/admin/workspaces";
import { setSessionCookie } from "@/lib/create-session";
import db from "@/packages/db/client";

const subjectTypes = new Set(Object.values(PlatformAdminSubjectType));
const reasons = new Set(Object.values(PlatformAdminWorkspaceReason));

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformAdmin();
    const body = await request.json();
    const subjectType = String(body.subjectType || "").toUpperCase();
    const subjectId = String(body.subjectId || "");
    const reason = String(body.reason || "").toUpperCase();
    const note = String(body.note || "").trim().slice(0, 1000) || null;
    if (
      !subjectTypes.has(subjectType as PlatformAdminSubjectType) ||
      !reasons.has(reason as PlatformAdminWorkspaceReason) ||
      !subjectId
    ) {
      return NextResponse.json(
        { message: "A valid account and access reason are required" },
        { status: 400 }
      );
    }
    const role = session.platformAccessRole;
    if (
      !role ||
      !isPlatformAdminRole(role) ||
      (!hasPlatformPermission(role, "workspace.read") &&
        !hasPlatformPermission(role, "workspace.manage"))
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const subject = await resolveManagedWorkspaceSubject(
      subjectType as PlatformAdminSubjectType,
      subjectId
    );
    if (!subject) {
      return NextResponse.json(
        { message: "Account is unavailable or suspended" },
        { status: 404 }
      );
    }
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const workspace = await db.platformAdminWorkspaceSession.create({
      data: {
        superUserId: session.id,
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        subjectRole: subject.role,
        subjectName: subject.name,
        schoolId: subject.schoolId,
        reason: reason as PlatformAdminWorkspaceReason,
        note,
        expiresAt,
      },
    });
    await logSuperUserAction({
      superUserId: session.id,
      workspaceSessionId: workspace.id,
      action: "MANAGED_WORKSPACE_OPENED",
      targetId: `${subject.subjectType.toLowerCase()}:${subject.subjectId}`,
      metadata: sanitizeAuditValue({
        reason,
        note,
        subjectName: subject.name,
        subjectRole: subject.role,
      }) as Prisma.InputJsonValue,
    });
    await setSessionCookie({
      id: subject.effectiveId,
      role: subject.role,
      name: subject.name,
      email: subject.email,
      schoolId: subject.schoolId,
      platformActorId: session.id,
      platformActorName: session.name,
      platformAccessRole: role,
      workspaceSessionId: workspace.id,
      workspaceExpiresAt: expiresAt.toISOString(),
      workspaceReason: reason,
    });
    return NextResponse.json({
      message: "Managed workspace opened",
      redirectUrl: subject.redirectUrl,
      expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open workspace";
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
