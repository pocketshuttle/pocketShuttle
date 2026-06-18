import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getApiSession, isDriver } from "@/lib/api-auth";
import { markDriverActive } from "@/lib/driver-activity";
import { distanceMeters, isCoordinates, type Coordinates } from "@/lib/google-geocoding";
import { recordChildDriverEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

type Params = { id: string };

const actionToEvent = {
  otw: "ON_THE_WAY_TO_SCHOOL",
  on_the_way: "ON_THE_WAY_TO_SCHOOL",
  picked_up: "PICKED_UP",
  dropped_off: "DROPPED_OFF",
} as const;

const DROPOFF_RADIUS_METERS = 250;

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!isDriver(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "").toLowerCase();
  const eventType = actionToEvent[action as keyof typeof actionToEvent];

  if (!eventType) {
    return NextResponse.json({ message: "Invalid child status action" }, { status: 400 });
  }

  const assignment = await db.childDriverAssignment.findFirst({
    where: {
      id,
      driverId: session.id,
      status: "ACTIVE",
      connection: { status: "PARENT_APPROVED" },
    },
    include: {
      parent: { select: { addressCoords: true } },
      child: { select: { address: true } },
      events: {
        where: {
          eventType: { in: ["PICKED_UP", "DROPPED_OFF"] },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  let driverCoords: Coordinates | null = null;
  let dropoffVerification: Prisma.InputJsonObject | null = null;

  if (eventType === "DROPPED_OFF") {
    driverCoords = {
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
    };

    if (!isCoordinates(driverCoords)) {
      return NextResponse.json({ message: "Driver GPS location is required for verified dropoff" }, { status: 400 });
    }

    const pickupCount = assignment.events.filter((event) => event.eventType === "PICKED_UP").length;
    const destinationType = pickupCount > 0 && pickupCount % 2 === 0 ? "home" : "school";
    const childCoordsRows = destinationType === "school"
      ? await db.$queryRaw<Array<{ schoolCoords: unknown }>>`
          SELECT "school_coords" AS "schoolCoords"
          FROM "parent_children"
          WHERE "parent_id" = ${assignment.parentId}
            AND LOWER(TRIM("address")) = LOWER(TRIM(${assignment.child.address || ""}))
            AND "school_coords" IS NOT NULL
          ORDER BY CASE WHEN "id" = ${assignment.childId} THEN 0 ELSE 1 END
          LIMIT 1
        `
      : [];
    const expectedCoords =
      destinationType === "home" ? assignment.parent.addressCoords : childCoordsRows[0]?.schoolCoords;

    if (!isCoordinates(expectedCoords)) {
      return NextResponse.json(
        {
          message:
            destinationType === "home"
              ? "Home location is not set for this parent."
              : "Dropoff location is not set for this child.",
        },
        { status: 400 }
      );
    }

    const distance = Math.round(distanceMeters(driverCoords, expectedCoords));
    const accuracy = typeof body.accuracy === "number" ? body.accuracy : null;

    dropoffVerification = {
      destinationType,
      expectedCoords,
      actualCoords: driverCoords,
      distanceMeters: distance,
      accuracy,
      radiusMeters: DROPOFF_RADIUS_METERS,
      verified: distance <= DROPOFF_RADIUS_METERS,
    };

    if (distance > DROPOFF_RADIUS_METERS) {
      return NextResponse.json(
        {
          message: `You are ${distance}m from the saved ${destinationType} location.`,
          verification: dropoffVerification,
        },
        { status: 400 }
      );
    }
  }

  const event = await recordChildDriverEvent({
    assignmentId: assignment.id,
    eventType,
    actorId: session.id,
    actorType: "driver",
    latitude: driverCoords?.latitude,
    longitude: driverCoords?.longitude,
    payload: {
      action,
      note: typeof body.note === "string" ? body.note : null,
      dropoffVerification,
    },
  });
  await markDriverActive(session.id);

  const updatedAssignment = await db.childDriverAssignment.findUnique({
    where: { id: assignment.id },
    include: {
      child: { select: { id: true, fullName: true, age: true, grade: true, address: true, image: true } },
      events: {
        where: {
          eventType: { in: ["ON_THE_WAY_TO_SCHOOL", "PICKED_UP", "DROPPED_OFF"] },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({ message: "Child status updated", event, assignment: updatedAssignment });
}
