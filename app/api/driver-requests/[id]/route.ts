import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import db from "@/packages/db/client";
import { getApiSession } from "@/lib/api-auth";

type Params = {
  id: string;
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!session || !["parent", "driver"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const actorId = session.id;
  const isParentActor = session.role === "parent";

  const body = await req.json();
  const action = String(body.action || "").toLowerCase();
  const { id } = await params;

  const request = await db.driverRequest.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, accountType: true, schoolId: true } },
      driver: { select: { id: true, accountType: true, schoolId: true, vehicleCapacity: true } },
      child: { select: { id: true } },
    },
  });

  if (!request) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  if (request.parent.accountType !== "STANDALONE" || request.parent.schoolId !== null) {
    return NextResponse.json({ message: "Invalid parent request" }, { status: 400 });
  }

  if (request.driver.accountType !== "STANDALONE" || request.driver.schoolId !== null) {
    return NextResponse.json({ message: "Invalid driver request" }, { status: 400 });
  }

  if (isParentActor) {
    if (request.parentId !== actorId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!["cancel", "cancelled"].includes(action)) {
      return NextResponse.json({ message: "Parents can only cancel requests" }, { status: 400 });
    }
    if (request.status === "ACCEPTED" && request.pickedUpAt && !request.droppedOffAt) {
      return NextResponse.json(
        { message: "Picked up trips cannot be cancelled. Contact support." },
        { status: 400 }
      );
    }
    if (request.droppedOffAt) {
      return NextResponse.json({ message: "Completed trips cannot be cancelled" }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const cancelled = await tx.driverRequest.update({
        where: { id: request.id },
        data: {
          status: "CANCELLED",
          respondedAt: new Date(),
        },
      });

      if (request.status === "ACCEPTED") {
        await tx.parentChild.update({
          where: { id: request.childId },
          data: { activeDriverId: null },
        });
      }

      return cancelled;
    });

    return NextResponse.json({ message: "Request cancelled", request: updated });
  }

  if (request.driverId !== actorId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!["accept", "decline", "picked_up", "dropped_off"].includes(action)) {
    return NextResponse.json({ message: "Invalid driver action" }, { status: 400 });
  }

  if (action === "picked_up") {
    if (request.status !== "ACCEPTED" || request.pickedUpAt || request.droppedOffAt) {
      return NextResponse.json({ message: "Only active accepted trips can be marked as picked up once" }, { status: 400 });
    }

    const updated = await db.driverRequest.update({
      where: { id: request.id },
      data: { pickedUpAt: new Date() },
    });

    return NextResponse.json({ message: "Pickup marked", request: updated });
  }

  if (action === "dropped_off") {
    if (request.status !== "ACCEPTED" || !request.pickedUpAt || request.droppedOffAt) {
      return NextResponse.json({ message: "Only picked up trips can be dropped off once" }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const droppedOff = await tx.driverRequest.update({
        where: { id: request.id },
        data: { droppedOffAt: new Date() },
      });

      await tx.parentChild.update({
        where: { id: request.childId },
        data: { activeDriverId: null },
      });

      return droppedOff;
    });

    return NextResponse.json({ message: "Drop-off marked", request: updated });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ message: "Only pending requests can be changed" }, { status: 400 });
  }

  if (action === "accept" && request.driver.vehicleCapacity) {
    const occupiedSeats = await db.driverRequest.count({
      where: {
        driverId: request.driverId,
        status: "ACCEPTED",
        droppedOffAt: null,
        id: { not: request.id },
      },
    });

    if (occupiedSeats >= request.driver.vehicleCapacity) {
      return NextResponse.json(
        { message: "Vehicle capacity has been reached." },
        { status: 409 }
      );
    }
  }

  const updated = await db.$transaction(async (tx) => {
    if (action === "accept") {
      if (request.driver.vehicleCapacity) {
        const occupiedSeats = await tx.driverRequest.count({
          where: {
            driverId: request.driverId,
            status: "ACCEPTED",
            droppedOffAt: null,
            id: { not: request.id },
          },
        });

        if (occupiedSeats >= request.driver.vehicleCapacity) {
          throw new Error("CAPACITY_REACHED");
        }
      }

      await tx.driverRequest.updateMany({
        where: {
          childId: request.childId,
          status: "PENDING",
          id: { not: request.id },
        },
        data: {
          status: "CANCELLED",
          respondedAt: new Date(),
        },
      });

      await tx.parentChild.update({
        where: { id: request.childId },
        data: { activeDriverId: request.driverId },
      });
    }

    return tx.driverRequest.update({
      where: { id: request.id },
      data: {
        status: action === "accept" ? "ACCEPTED" : "DECLINED",
        respondedAt: new Date(),
      },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  }).catch((error) => {
    if (error instanceof Error && error.message === "CAPACITY_REACHED") {
      return null;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return null;
    }
    throw error;
  });

  if (!updated) {
    return NextResponse.json(
      { message: "Vehicle capacity has been reached." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    message: action === "accept" ? "Request accepted" : "Request declined",
    request: updated,
  });
}
