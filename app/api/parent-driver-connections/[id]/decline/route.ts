import { NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { sendKnownDriverRealtimeEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

type Params = { id: string };

export async function PATCH(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!session || session.role !== "driver") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const connection = await db.parentDriverConnection.findFirst({
    where: { id, driverId: session.id },
  });

  if (!connection) {
    return NextResponse.json({ message: "Connection not found" }, { status: 404 });
  }

  if (connection.status !== "INVITED" || connection.requestedBy !== "parent") {
    return NextResponse.json(
      { message: "This connection is waiting for the other party" },
      { status: 400 }
    );
  }

  const updated = await db.parentDriverConnection.update({
    where: { id: connection.id },
    data: {
      status: "DECLINED",
      revokedAt: new Date(),
    },
  });

  await sendKnownDriverRealtimeEvent({
    parentId: updated.parentId,
    driverId: updated.driverId,
    event: "connection-updated",
  });

  return NextResponse.json({ message: "Request declined", connection: updated });
}
