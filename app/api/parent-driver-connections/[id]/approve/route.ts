import { NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { markDriverActive } from "@/lib/driver-activity";
import { sendKnownDriverRealtimeEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

type Params = { id: string };

export async function PATCH(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  const isParentSession = session?.role === "parent";
  const isDriverSession = session?.role === "driver";

  if (!session || (!isParentSession && !isDriverSession)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const connection = await db.parentDriverConnection.findFirst({
    where: isParentSession ? { id, parentId: session.id } : { id, driverId: session.id },
  });

  if (!connection) {
    return NextResponse.json({ message: "Connection not found" }, { status: 404 });
  }

  const canParentApprove = isParentSession && connection.status === "DRIVER_REQUESTED";
  const canDriverApprove =
    isDriverSession && connection.status === "INVITED" && connection.requestedBy === "parent";

  if (!canParentApprove && !canDriverApprove) {
    return NextResponse.json({ message: "This connection is waiting for the other party" }, { status: 400 });
  }

  const updated = await db.parentDriverConnection.update({
    where: { id: connection.id },
    data: {
      status: "PARENT_APPROVED",
      approvedAt: new Date(),
      revokedAt: null,
    },
  });

  await sendKnownDriverRealtimeEvent({
    parentId: updated.parentId,
    driverId: updated.driverId,
    event: "connection-approved",
  });

  if (isDriverSession) {
    await markDriverActive(session.id);
  }

  return NextResponse.json({ message: "Connection approved", connection: updated });
}
