import { NextRequest, NextResponse } from "next/server";

import { getApiSession, isDriver } from "@/lib/api-auth";
import { recordChildDriverEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!isDriver(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ message: "Valid latitude and longitude are required" }, { status: 400 });
  }

  await db.driver.update({
    where: { id: session.id },
    data: {
      liveAddress: { latitude, longitude },
    },
  });

  const activeAssignments = await db.childDriverAssignment.findMany({
    where: {
      driverId: session.id,
      status: "ACTIVE",
      connection: { status: "PARENT_APPROVED" },
    },
    select: { id: true },
  });

  await Promise.all(
    activeAssignments.map((assignment) =>
      recordChildDriverEvent({
        assignmentId: assignment.id,
        eventType: "LOCATION_UPDATED",
        actorId: session.id,
        actorType: "driver",
        latitude,
        longitude,
        payload: {
          accuracy: typeof body.accuracy === "number" ? body.accuracy : null,
          continuous: Boolean(body.continuous),
          sharedAt: new Date().toISOString(),
        },
        notifyParent: false,
      }).catch((error) => {
        console.error("Driver location assignment event failed:", error);
      })
    )
  );

  return NextResponse.json({ message: "Location updated" });
}
