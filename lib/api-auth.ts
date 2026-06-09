import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { decrypt } from "@/lib/create-session";

export type ApiSession = {
  id: string;
  role: string;
  schoolId: string | null;
  email?: string | null;
  name?: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.toLowerCase() : "";
}

export async function getApiSession(): Promise<ApiSession | null> {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
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

  return {
    id,
    role,
    schoolId,
    email: asString(session?.email),
    name: asString(session?.name),
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
