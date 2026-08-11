import "server-only";

import { cookies } from "next/headers";
import { headers } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { decrypt } from "@/lib/create-session";
import {
  isPlatformAdminRole,
  PlatformAdminAccessRole,
} from "@/lib/admin/permissions";
import db from "@/packages/db/client";

export type ApiSession = {
  id: string;
  role: string;
  schoolId: string | null;
  email?: string | null;
  name?: string | null;
  platformAccessRole?: PlatformAdminAccessRole | null;
  platformActor?: {
    id: string;
    name?: string | null;
    accessRole: PlatformAdminAccessRole;
    workspaceSessionId: string;
    reason: string;
  } | null;
};

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.toLowerCase() : "";
}

async function isAccountSuspended(role: string, id: string): Promise<boolean> {
  if (role === "parent") {
    const row = await db.parent.findUnique({ where: { id }, select: { suspendedAt: true } });
    return !!row?.suspendedAt;
  }
  if (role === "driver") {
    const row = await db.driver.findUnique({ where: { id }, select: { suspendedAt: true } });
    return !!row?.suspendedAt;
  }
  if (role === "teacher") {
    const row = await db.teacher.findUnique({ where: { id }, select: { suspendedAt: true } });
    return !!row?.suspendedAt;
  }
  if (role === "admin" || role === "school") {
    const row = await db.user.findUnique({ where: { id }, select: { suspendedAt: true } });
    return !!row?.suspendedAt;
  }
  return false;
}

export async function getApiSession(): Promise<ApiSession | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) {
    return null;
  }

  const session = await decrypt(cookie);
  const id = asString(session?.id);
  if (!id) {
    return null;
  }

  const role = normalizeRole(session?.role);
  const schoolId =
    asString(session?.schoolId) ?? (role === "admin" || role === "school" ? id : null);
  const platformActorId = asString(session?.platformActorId);
  let platformActor: ApiSession["platformActor"] = null;
  let platformAccessRole: PlatformAdminAccessRole | null = null;

  if (role === "superadmin") {
    const admin = await db.superUser.findUnique({
      where: { id },
      select: { status: true, accessRole: true },
    });
    if (
      !admin ||
      admin.status !== "ACTIVE" ||
      !isPlatformAdminRole(admin.accessRole)
    ) {
      return null;
    }
    platformAccessRole = admin.accessRole;
  } else if (platformActorId) {
    const workspaceSessionId = asString(session?.workspaceSessionId);
    if (!workspaceSessionId) return null;
    const [admin, workspace] = await Promise.all([
      db.superUser.findUnique({
        where: { id: platformActorId },
        select: { id: true, name: true, accessRole: true, status: true },
      }),
      db.platformAdminWorkspaceSession.findUnique({
        where: { id: workspaceSessionId },
      }),
    ]);
    if (
      !admin ||
      admin.status !== "ACTIVE" ||
      !isPlatformAdminRole(admin.accessRole) ||
      !workspace ||
      workspace.superUserId !== admin.id ||
      !(
        workspace.subjectId === id ||
        (workspace.subjectRole === "admin" && workspace.schoolId === id)
      ) ||
      workspace.subjectRole !== role ||
      workspace.endedAt ||
      workspace.expiresAt <= new Date()
    ) {
      return null;
    }
    platformActor = {
      id: admin.id,
      name: admin.name,
      accessRole: admin.accessRole,
      workspaceSessionId: workspace.id,
      reason: workspace.reason,
    };
    const requestHeaders = await headers();
    const requestId = requestHeaders.get("x-platform-audit-request-id");
    if (requestId) {
      const existingAudit = await db.superUserAction.findFirst({
        where: {
          superUserId: admin.id,
          workspaceSessionId: workspace.id,
          action: "MANAGED_WORKSPACE_MUTATION_REQUEST",
          metadata: { path: ["requestId"], equals: requestId },
        },
        select: { id: true },
      });
      if (!existingAudit) {
        await db.superUserAction.create({
          data: {
            superUserId: admin.id,
            workspaceSessionId: workspace.id,
            action: "MANAGED_WORKSPACE_MUTATION_REQUEST",
            targetId: `${role}:${id}`,
            metadata: {
              requestId,
              method: requestHeaders.get("x-platform-audit-method"),
              path: requestHeaders.get("x-platform-audit-path"),
              subjectId: id,
              subjectRole: role,
              reason: workspace.reason,
            },
          },
        });
      }
    }
  } else if (await isAccountSuspended(role, id)) {
    return null;
  }

  return {
    id,
    role,
    schoolId,
    email: asString(session?.email),
    name: asString(session?.name),
    platformAccessRole,
    platformActor,
  };
}

export function canManageSchool(session: ApiSession | null): session is ApiSession {
  return !!session && ["admin", "school"].includes(session.role);
}

export function canManagePlatform(session: ApiSession | null): session is ApiSession {
  return !!session && session.role === "superadmin";
}

export function canManageStudentRecords(
  session: ApiSession | null
): session is ApiSession {
  return !!session && ["admin", "school", "teacher"].includes(session.role);
}

export function isTeacher(session: ApiSession | null): session is ApiSession {
  return !!session && session.role === "teacher";
}

export function isParent(session: ApiSession | null): session is ApiSession {
  return !!session && session.role === "parent";
}

export function isDriver(session: ApiSession | null): session is ApiSession {
  return !!session && session.role === "driver";
}
