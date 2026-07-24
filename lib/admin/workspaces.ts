import "server-only";

import { PlatformAdminSubjectType } from "@prisma/client";

import db from "@/packages/db/client";

export type ManagedWorkspaceSubject = {
  subjectType: PlatformAdminSubjectType;
  subjectId: string;
  effectiveId: string;
  role: "admin" | "parent" | "driver" | "teacher";
  name: string;
  email: string | null;
  schoolId: string | null;
  redirectUrl: string;
};

export async function resolveManagedWorkspaceSubject(
  subjectType: PlatformAdminSubjectType,
  subjectId: string
): Promise<ManagedWorkspaceSubject | null> {
  if (subjectType === "SCHOOL") {
    const school = await db.user.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, email: true, suspendedAt: true },
    });
    if (!school || school.suspendedAt) return null;
    return {
      subjectType,
      subjectId: school.id,
      effectiveId: school.id,
      role: "admin",
      name: school.name || "School",
      email: school.email,
      schoolId: school.id,
      redirectUrl: "/dashboard",
    };
  }
  if (subjectType === "PARENT") {
    const parent = await db.parent.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        full_name: true,
        email: true,
        schoolId: true,
        suspendedAt: true,
      },
    });
    if (!parent || parent.suspendedAt) return null;
    return {
      subjectType,
      subjectId: parent.id,
      effectiveId: parent.id,
      role: "parent",
      name: parent.full_name || "Parent",
      email: parent.email,
      schoolId: parent.schoolId,
      redirectUrl: "/parent",
    };
  }
  if (subjectType === "DRIVER") {
    const driver = await db.driver.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        full_name: true,
        email: true,
        schoolId: true,
        accountType: true,
        suspendedAt: true,
      },
    });
    if (!driver || driver.suspendedAt) return null;
    return {
      subjectType,
      subjectId: driver.id,
      effectiveId:
        driver.accountType === "SCHOOL_MANAGED" && driver.schoolId
          ? driver.schoolId
          : driver.id,
      role:
        driver.accountType === "SCHOOL_MANAGED" && driver.schoolId
          ? "admin"
          : "driver",
      name: driver.full_name,
      email: driver.email,
      schoolId: driver.schoolId,
      redirectUrl:
        driver.accountType === "SCHOOL_MANAGED" && driver.schoolId
          ? `/dashboard/drivers/${driver.id}`
          : "/driver",
    };
  }
  const teacher = await db.teacher.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
      full_name: true,
      email: true,
      schoolId: true,
      suspendedAt: true,
    },
  });
  if (!teacher || teacher.suspendedAt) return null;
  return {
    subjectType,
    subjectId: teacher.id,
    effectiveId: teacher.id,
    role: "teacher",
    name: teacher.full_name || "Teacher",
    email: teacher.email,
    schoolId: teacher.schoolId,
    redirectUrl: "/teacher",
  };
}
