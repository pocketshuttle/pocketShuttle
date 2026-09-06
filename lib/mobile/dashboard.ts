import "server-only";

import { Prisma } from "@prisma/client";

import { getEntitlements, historyCutoff } from "@/lib/billing/entitlements";
import { MobileActor } from "@/lib/mobile/auth";
import db from "@/packages/db/client";

const tripSummarySelect = {
  id: true,
  title: true,
  tripType: true,
  status: true,
  safetyState: true,
  origin: true,
  destination: true,
  driverId: true,
  vehicleId: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  locations: {
    orderBy: { timestamp: "desc" as const },
    take: 1,
    select: {
      lat: true,
      lng: true,
      speed: true,
      heading: true,
      accuracy: true,
      timestamp: true,
    },
  },
  events: {
    orderBy: { timestamp: "desc" as const },
    take: 20,
    select: {
      id: true,
      eventType: true,
      actorType: true,
      payload: true,
      timestamp: true,
    },
  },
} satisfies Prisma.TripSelect;

async function cutoffFor(actor: MobileActor) {
  try {
    const entitlements = await getEntitlements({
      id: actor.id,
      role: actor.role,
      schoolId: actor.schoolId,
    });
    return {
      cutoff: historyCutoff(entitlements),
      plan: {
        code: entitlements.planCode,
        name: entitlements.planName,
        status: entitlements.status,
      },
    };
  } catch {
    return {
      cutoff: new Date(Date.now() - 24 * 60 * 60 * 1000),
      plan: { code: "FREE", name: "Free", status: "ACTIVE" },
    };
  }
}

async function tripScope(actor: MobileActor): Promise<Prisma.TripWhereInput> {
  if (actor.role === "driver") {
    const driver = await db.driver.findUnique({
      where: { id: actor.id },
      select: { busId: true },
    });
    return {
      OR: [
        { driverId: actor.id },
        { createdBy: actor.id },
        {
          participants: {
            some: { participantType: "driver", participantId: actor.id },
          },
        },
        ...(driver?.busId ? [{ busId: driver.busId }] : []),
      ],
    };
  }
  if (actor.role === "teacher") {
    const teacher = await db.teacher.findUnique({
      where: { id: actor.id },
      select: { busId: true },
    });
    return {
      OR: [
        { createdBy: actor.id },
        {
          participants: {
            some: { participantType: "teacher", participantId: actor.id },
          },
        },
        ...(teacher?.busId ? [{ busId: teacher.busId }] : []),
      ],
    };
  }
  const [children, students] = await Promise.all([
    db.parentChild.findMany({
      where: { parentId: actor.id },
      select: { id: true },
    }),
    db.student.findMany({
      where: { parentId: actor.id },
      select: { id: true },
    }),
  ]);
  const childIds = [...children, ...students].map((item) => item.id);
  return {
    OR: [
      { createdBy: actor.id },
      {
        viewers: {
          some: {
            viewerId: actor.id,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
      ...(childIds.length
        ? [
            {
              participants: {
                some: { participantId: { in: childIds } },
              },
            },
          ]
        : []),
    ],
  };
}

export async function mobileTrips(actor: MobileActor) {
  const [{ cutoff, plan }, scope] = await Promise.all([
    cutoffFor(actor),
    tripScope(actor),
  ]);
  const [active, recent] = await Promise.all([
    db.trip.findMany({
      where: {
        AND: [
          scope,
          { status: { in: ["active", "paused", "emergency", "scheduled"] } },
        ],
      },
      select: tripSummarySelect,
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.trip.findMany({
      where: {
        AND: [
          scope,
          ...(cutoff ? [{ createdAt: { gte: cutoff } }] : []),
          { status: { in: ["completed", "cancelled"] } },
        ],
      },
      select: tripSummarySelect,
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);
  return { active, recent, historyCutoff: cutoff, plan };
}

export async function parentMobileDashboard(actor: MobileActor) {
  const [children, schoolChildren, assignments, trips] = await Promise.all([
    db.parentChild.findMany({
      where: { parentId: actor.id },
      select: {
        id: true,
        fullName: true,
        image: true,
        grade: true,
        pickupNote: true,
      },
      orderBy: { fullName: "asc" },
    }),
    db.student.findMany({
      where: { parentId: actor.id },
      select: {
        id: true,
        full_name: true,
        image: true,
        grade: true,
        attendance: true,
        status: true,
        presence: true,
      },
      orderBy: { full_name: "asc" },
    }),
    db.childDriverAssignment.findMany({
      where: { parentId: actor.id, status: { not: "REVOKED" } },
      select: {
        id: true,
        status: true,
        billingStatus: true,
        lastStatus: true,
        lastStatusAt: true,
        child: { select: { id: true, fullName: true, image: true } },
        driver: {
          select: {
            id: true,
            full_name: true,
            image: true,
            phoneNumber: true,
            carMake: true,
            carModel: true,
            carColor: true,
            plateNumber: true,
            liveAddress: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    mobileTrips(actor),
  ]);
  return {
    profile: actor,
    children: [
      ...children.map((child) => ({ ...child, name: child.fullName, source: "family" })),
      ...schoolChildren.map((child) => ({
        ...child,
        name: child.full_name,
        source: "school",
      })),
    ],
    assignments,
    trips,
  };
}

export async function driverMobileDashboard(actor: MobileActor) {
  const [driver, assignments, trips] = await Promise.all([
    db.driver.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        full_name: true,
        verificationStatus: true,
        carMake: true,
        carModel: true,
        carColor: true,
        plateNumber: true,
        bus: {
          select: {
            id: true,
            bus_product_name: true,
            bus_number: true,
            route: { select: { id: true, route_name: true } },
          },
        },
      },
    }),
    db.childDriverAssignment.findMany({
      where: { driverId: actor.id, status: { not: "REVOKED" } },
      select: {
        id: true,
        status: true,
        billingStatus: true,
        lastStatus: true,
        lastStatusAt: true,
        child: {
          select: {
            id: true,
            fullName: true,
            image: true,
            pickupNote: true,
            address: true,
          },
        },
        parent: {
          select: { id: true, full_name: true, phoneNumber: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    mobileTrips(actor),
  ]);
  return { profile: actor, driver, assignments, trips };
}

export async function teacherMobileDashboard(actor: MobileActor) {
  const [teacher, students, trips] = await Promise.all([
    db.teacher.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        full_name: true,
        phoneNumber: true,
        bus: {
          select: {
            id: true,
            bus_product_name: true,
            bus_number: true,
            route: { select: { id: true, route_name: true } },
          },
        },
      },
    }),
    db.student.findMany({
      where: { teacherId: actor.id },
      select: {
        id: true,
        full_name: true,
        image: true,
        grade: true,
        attendance: true,
        status: true,
        presence: true,
        parent: {
          select: { id: true, full_name: true, phoneNumber: true },
        },
      },
      orderBy: { full_name: "asc" },
    }),
    mobileTrips(actor),
  ]);
  return { profile: actor, teacher, students, trips };
}
