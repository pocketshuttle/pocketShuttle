import { NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import { recordChildDriverEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

type Params = { id: string };

export async function POST(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assignment = await db.childDriverAssignment.findFirst({
    where: {
      id,
      parentId: session.id,
      status: "ACTIVE",
      connection: { status: "PARENT_APPROVED" },
    },
    include: {
      child: { select: { fullName: true } },
      driver: { select: { full_name: true } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  const event = await recordChildDriverEvent({
    assignmentId: assignment.id,
    eventType: "LOCATION_REQUESTED",
    actorId: session.id,
    actorType: "parent",
    payload: {
      childName: assignment.child.fullName,
      driverName: assignment.driver.full_name,
    },
    notifyParent: false,
  });

  return NextResponse.json({
    message: "Location request sent",
    event,
  });
}
