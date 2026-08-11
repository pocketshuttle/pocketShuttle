import { NextResponse } from "next/server";

import { getApiSession, isDriver, isParent } from "@/lib/api-auth";
import db from "@/packages/db/client";

export async function GET() {
  const session = await getApiSession();
  if (!isParent(session) && !isDriver(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const events = await db.childDriverEvent.findMany({
    where: session.role === "parent" ? { parentId: session.id } : { driverId: session.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      assignmentId: true,
      eventType: true,
      actorType: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      driver: { select: { id: true, full_name: true } },
      parent: { select: { id: true, full_name: true } },
      child: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ events });
}
