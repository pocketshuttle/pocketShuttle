import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isParent } from "@/lib/api-auth";
import { DriverRequestSchema } from "@/schemas";

export async function GET() {
  const session = await getApiSession();
  if (!session || !["parent", "driver"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const actorId = session.id;
  const isParentActor = session.role === "parent";

  const requests = await db.driverRequest.findMany({
    where: isParentActor
      ? {
          parentId: actorId,
          parent: { accountType: "STANDALONE", schoolId: null },
        }
      : {
          driverId: actorId,
          driver: { accountType: "STANDALONE", schoolId: null },
        },
    include: {
      child: true,
      parent: {
        select: { id: true, full_name: true, phoneNumber: true, address: true, image: true },
      },
      driver: {
        select: {
          id: true,
          full_name: true,
          phoneNumber: true,
          liveAddress: true,
          serviceAreas: true,
          verificationStatus: true,
          carMake: true,
          carModel: true,
          carColor: true,
          plateNumber: true,
          vehicleCapacity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const responseRequests = isParentActor
    ? requests
    : requests.map((request) => ({
        ...request,
        parent: {
          ...request.parent,
          address: request.status === "ACCEPTED" ? request.parent.address : null,
        },
        parentPickupCount: requests.filter(
          (item) =>
            item.parentId === request.parentId &&
            ["PENDING", "ACCEPTED"].includes(item.status) &&
            !item.droppedOffAt
        ).length,
        child: {
          ...request.child,
          address: request.pickedUpAt ? request.child.address : null,
        },
      }));

  return NextResponse.json({ requests: responseRequests });
}

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = DriverRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [parent, child, driver] = await Promise.all([
    db.parent.findFirst({
      where: { id: session.id, accountType: "STANDALONE", schoolId: null },
      select: { id: true },
    }),
    db.parentChild.findFirst({
      where: { id: parsed.data.childId, parentId: session.id },
      select: { id: true },
    }),
    db.driver.findFirst({
      where: {
        id: parsed.data.driverId,
        accountType: "STANDALONE",
        schoolId: null,
      },
      select: { id: true, verificationStatus: true, vehicleCapacity: true },
    }),
  ]);

  if (!parent || !child) {
    return NextResponse.json({ message: "Child not found" }, { status: 404 });
  }

  if (!driver) {
    return NextResponse.json({ message: "Driver not found" }, { status: 404 });
  }

  if (driver.verificationStatus !== "VERIFIED") {
    return NextResponse.json(
      { message: "You can only request verified drivers." },
      { status: 400 }
    );
  }

  if (driver.vehicleCapacity) {
    const occupiedSeats = await db.driverRequest.count({
      where: {
        driverId: driver.id,
        status: "ACCEPTED",
        droppedOffAt: null,
      },
    });

    if (occupiedSeats >= driver.vehicleCapacity) {
      return NextResponse.json(
        { message: "This driver's vehicle is full right now." },
        { status: 409 }
      );
    }
  }

  const existingPending = await db.driverRequest.findFirst({
    where: {
      childId: child.id,
      driverId: driver.id,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (existingPending) {
    return NextResponse.json(
      { message: "You already have a pending request with this driver." },
      { status: 409 }
    );
  }

  const request = await db.driverRequest.create({
    data: {
      parentId: parent.id,
      childId: child.id,
      driverId: driver.id,
      routeArea: parsed.data.routeArea,
      note: parsed.data.note,
    },
    include: {
      child: true,
      driver: {
        select: {
          id: true,
          full_name: true,
          liveAddress: true,
          serviceAreas: true,
          verificationStatus: true,
          carMake: true,
          carModel: true,
          carColor: true,
          plateNumber: true,
          vehicleCapacity: true,
        },
      },
    },
  });

  return NextResponse.json({ message: "Request sent", request }, { status: 201 });
}
