"use server";
import { cookies } from "next/headers";
import { decrypt } from "./create-session";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { cache } from "react";
import { redirect } from "next/navigation";
import db from "@/packages/db/client";

export const getUserSession = cache(async () => {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!cookie) {
    console.log("No cookie found");
    redirect("/login");
  }

  const session = await decrypt(cookie);

  if (!session?.id) {
    redirect("/login");
  }

  const role = String(session.role || "").toLowerCase();
  if (role === "superadmin") {
    const admin = await db.superUser.findUnique({
      where: { id: String(session.id) },
      select: { accessRole: true, status: true },
    });
    if (!admin || admin.status !== "ACTIVE") redirect("/admin/login");
    session.platformAccessRole = admin.accessRole;
  } else if (session.platformActorId && session.workspaceSessionId) {
    const [admin, workspace] = await Promise.all([
      db.superUser.findUnique({
        where: { id: String(session.platformActorId) },
        select: { accessRole: true, status: true },
      }),
      db.platformAdminWorkspaceSession.findUnique({
        where: { id: String(session.workspaceSessionId) },
      }),
    ]);
    if (
      !admin ||
      admin.status !== "ACTIVE" ||
      !workspace ||
      workspace.superUserId !== String(session.platformActorId) ||
      !(
        workspace.subjectId === String(session.id) ||
        (workspace.subjectRole === "admin" &&
          workspace.schoolId === String(session.id))
      ) ||
      workspace.subjectRole !== role ||
      workspace.endedAt ||
      workspace.expiresAt <= new Date()
    ) {
      redirect("/admin/login");
    }
    session.platformAccessRole = admin.accessRole;
  }

  return session;
});
