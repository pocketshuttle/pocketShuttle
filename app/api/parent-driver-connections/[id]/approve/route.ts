import { NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import { sendKnownDriverRealtimeEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

type Params = { id: string };

export async function PATCH(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const connection = await db.parentDriverConnection.findFirst({
    where: { id, parentId: session.id },
  });

  if (!connection) {
    return NextResponse.json({ message: "Connection not found" }, { status: 404 });
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

  return NextResponse.json({ message: "Driver approved", connection: updated });
}
