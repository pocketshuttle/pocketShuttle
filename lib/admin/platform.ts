import "server-only";

import { Prisma } from "@prisma/client";

import { ApiSession, canManagePlatform, getApiSession } from "@/lib/api-auth";
import db from "@/packages/db/client";

export type AdminAccountType = "school" | "parent" | "driver" | "teacher" | "superadmin";

export async function requirePlatformAdmin(): Promise<ApiSession> {
  const session = await getApiSession();
  if (!canManagePlatform(session)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function parseUserKey(key: string): { type: AdminAccountType; id: string } | null {
  const [type, ...rest] = key.split(":");
  const id = rest.join(":");
  if (!id) return null;
  if (!["school", "parent", "driver", "teacher", "superadmin"].includes(type)) return null;
  return { type: type as AdminAccountType, id };
}

export async function logSuperUserAction({
  superUserId,
  action,
  targetId,
  metadata,
}: {
  superUserId: string;
  action: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.superUserAction.create({
    data: {
      superUserId,
      action,
      targetId,
      metadata,
    },
  });
}

export async function setSuspension({
  actorId,
  type,
  id,
  suspend,
  reason,
}: {
  actorId: string;
  type: AdminAccountType;
  id: string;
  suspend: boolean;
  reason?: string | null;
}) {
  const data = suspend
    ? {
        suspendedAt: new Date(),
        suspendedReason: reason || "Suspended by super admin",
        suspendedById: actorId,
      }
    : {
        suspendedAt: null,
        suspendedReason: null,
        suspendedById: null,
      };

  if (type === "school") {
    await db.user.update({ where: { id }, data });
  } else if (type === "parent") {
    await db.parent.update({ where: { id }, data });
  } else if (type === "driver") {
    await db.driver.update({ where: { id }, data });
  } else if (type === "teacher") {
    await db.teacher.update({ where: { id }, data });
  } else {
    throw new Error("Super admins cannot be suspended from this dashboard");
  }

  await logSuperUserAction({
    superUserId: actorId,
    action: suspend ? "ACCOUNT_SUSPENDED" : "ACCOUNT_UNSUSPENDED",
    targetId: `${type}:${id}`,
    metadata: { type, reason: reason || null },
  });
}

export async function getPlatformOverview() {
  const countSuspended = async (
    tableName: "users" | "parents" | "drivers" | "teachers"
  ) => {
    try {
      const rows = await db.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*)::bigint AS count FROM "${tableName}" WHERE "suspended_at" IS NOT NULL`
      );

      return Number(rows[0]?.count || 0);
    } catch {
      return 0;
    }
  };

  const [
    schools,
    parents,
    drivers,
    teachers,
    students,
    pendingVerifications,
    activeRequests,
    activeSubscriptions,
    knownDriverConnections,
    pendingKnownDriverConnections,
    activeChildDriverAssignments,
    multiFamilyDriverRows,
    trialsEndingSoon,
    overdueKnownDriverPayments,
    suspendedSchools,
    suspendedParents,
    suspendedDrivers,
    suspendedTeachers,
  ] = await Promise.all([
    db.user.count(),
    db.parent.count(),
    db.driver.count(),
    db.teacher.count(),
    db.student.count(),
    db.driver.count({ where: { accountType: "STANDALONE", schoolId: null, verificationStatus: "PENDING_REVIEW" } }),
    db.driverRequest.count({ where: { status: { in: ["PENDING", "ACCEPTED"] } } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.parentDriverConnection.count(),
    db.parentDriverConnection.count({ where: { status: { in: ["INVITED", "DRIVER_REQUESTED"] } } }),
    db.childDriverAssignment.count({ where: { status: "ACTIVE" } }),
    db.childDriverAssignment.groupBy({
      by: ["driverId"],
      where: { status: "ACTIVE" },
      _count: { parentId: true },
    }),
    db.childDriverAssignment.count({
      where: {
        billingStatus: "FREE_TRIAL",
        trialEndsAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    db.knownDriverPayment.count({ where: { status: "FAILED" } }),
    countSuspended("users"),
    countSuspended("parents"),
    countSuspended("drivers"),
    countSuspended("teachers"),
  ]);

  return {
    schools,
    parents,
    drivers,
    teachers,
    students,
    pendingVerifications,
    activeRequests,
    activeSubscriptions,
    knownDriverConnections,
    pendingKnownDriverConnections,
    activeChildDriverAssignments,
    multiFamilyDrivers: multiFamilyDriverRows.filter((row) => row._count.parentId > 1).length,
    trialsEndingSoon,
    overdueKnownDriverPayments,
    suspendedAccounts: suspendedSchools + suspendedParents + suspendedDrivers + suspendedTeachers,
  };
}

export async function getUnifiedUsers() {
  const [schools, parents, drivers, teachers, superAdmins] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        suspendedAt: true,
        suspendedReason: true,
        Subscription: { select: { status: true, subscriptionPlan: true }, take: 1, orderBy: { startDate: "desc" } },
        _count: { select: { Teacher: true, Driver: true, Parent: true, Student: true, Buses: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.parent.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        accountType: true,
        schoolId: true,
        phoneNumber: true,
        image: true,
        emailVerified: true,
        suspendedAt: true,
        suspendedReason: true,
        driverConnections: { select: { id: true, status: true } },
        childDriverAssignments: { select: { id: true, status: true, billingStatus: true } },
        _count: { select: { Student: true, ParentChild: true, DriverRequest: true } },
      },
      orderBy: { full_name: "asc" },
    }),
    db.driver.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        accountType: true,
        schoolId: true,
        phoneNumber: true,
        image: true,
        emailVerified: true,
        verificationStatus: true,
        suspendedAt: true,
        suspendedReason: true,
        shareProfile: { select: { shareId: true } },
        parentConnections: { select: { id: true, status: true, parentId: true } },
        childAssignments: { select: { id: true, status: true, parentId: true } },
        _count: { select: { DriverRequest: true, ParentChild: true } },
      },
      orderBy: { full_name: "asc" },
    }),
    db.teacher.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        schoolId: true,
        phoneNumber: true,
        image: true,
        emailVerified: true,
        suspendedAt: true,
        suspendedReason: true,
        _count: { select: { Student: true } },
      },
      orderBy: { full_name: "asc" },
    }),
    db.superUser.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return [
    ...schools.map((user) => ({
      key: `school:${user.id}`,
      id: user.id,
      type: "school",
      name: user.name || "Unnamed school",
      email: user.email,
      role: user.role,
      accountType: "SCHOOL",
      phoneNumber: null,
      status: user.suspendedAt ? "SUSPENDED" : "ACTIVE",
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      meta: `${user._count.Teacher} teachers, ${user._count.Student} students, ${user._count.Buses} buses`,
      subscription: user.Subscription[0]?.subscriptionPlan || "FREE",
    })),
    ...parents.map((user) => ({
      key: `parent:${user.id}`,
      id: user.id,
      type: "parent",
      name: user.full_name || "Unnamed parent",
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      phoneNumber: user.phoneNumber,
      status: user.suspendedAt ? "SUSPENDED" : "ACTIVE",
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      meta: `${user._count.Student + user._count.ParentChild} kids, ${user.driverConnections.length} known drivers, ${user.childDriverAssignments.length} assignments`,
    })),
    ...drivers.map((user) => ({
      key: `driver:${user.id}`,
      id: user.id,
      type: "driver",
      name: user.full_name || "Unnamed driver",
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      phoneNumber: user.phoneNumber,
      status: user.suspendedAt ? "SUSPENDED" : user.verificationStatus,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      meta: `${user.parentConnections.length} families, ${user.childAssignments.length} assigned kids, ${user.shareProfile?.shareId || "no share ID"}`,
    })),
    ...teachers.map((user) => ({
      key: `teacher:${user.id}`,
      id: user.id,
      type: "teacher",
      name: user.full_name || "Unnamed teacher",
      email: user.email,
      role: user.role,
      accountType: "SCHOOL_MANAGED",
      phoneNumber: user.phoneNumber,
      status: user.suspendedAt ? "SUSPENDED" : "ACTIVE",
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      meta: `${user._count.Student} students`,
    })),
    ...superAdmins.map((user) => ({
      key: `superadmin:${user.id}`,
      id: user.id,
      type: "superadmin",
      name: user.name || "Super admin",
      email: user.email,
      role: user.role,
      accountType: "PLATFORM",
      phoneNumber: null,
      status: "ACTIVE",
      suspendedAt: null,
      suspendedReason: null,
      meta: "Platform access",
    })),
  ];
}
