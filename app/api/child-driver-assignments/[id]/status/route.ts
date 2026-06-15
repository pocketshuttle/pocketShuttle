import { NextRequest, NextResponse } from "next/server";

import { getApiSession, isDriver } from "@/lib/api-auth";
import { recordChildDriverEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

type Params = { id: string };

const actionToEvent = {
  otw: "ON_THE_WAY_TO_SCHOOL",
  on_the_way: "ON_THE_WAY_TO_SCHOOL",
  picked_up: "PICKED_UP",
  dropped_off: "DROPPED_OFF",
} as const;

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
  });

  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  const event = await recordChildDriverEvent({
    assignmentId: assignment.id,
    eventType,
    actorId: session.id,
    actorType: "driver",
    payload: {
      action,
      note: typeof body.note === "string" ? body.note : null,
    },
  });

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
