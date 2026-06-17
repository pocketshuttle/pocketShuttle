import { NextRequest, NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import { sendKnownDriverRealtimeEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

type Params = { id: string };

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (reason.length < 5) {
    return NextResponse.json({ message: "Please provide a revocation reason" }, { status: 400 });
  }

  const connection = await db.parentDriverConnection.findFirst({
    where: { id, parentId: session.id },
  });

  if (!connection) {
    return NextResponse.json({ message: "Connection not found" }, { status: 404 });
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.childDriverAssignment.updateMany({
      where: { connectionId: connection.id },
      data: { status: "REVOKED", billingStatus: "CANCELLED" },
    });

    return tx.parentDriverConnection.update({
      where: { id: connection.id },
      data: {
        status: "REVOKED",
        note: reason,
        revokedAt: new Date(),
      },
    });
  });

  await sendKnownDriverRealtimeEvent({
    parentId: updated.parentId,
    driverId: updated.driverId,
    event: "connection-revoked",
  });

  return NextResponse.json({ message: "Driver access revoked", connection: updated });
}
