import { NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { markDriverActive } from "@/lib/driver-activity";
import { sendKnownDriverRealtimeEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";
import { getFamilyEntitlements } from "@/lib/billing/entitlements";
import { assertDriverConnectionApprovalAllowed } from "@/lib/billing/family-limits";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import { withSerializableTransaction } from "@/lib/prisma-transactions";

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

  const resolved = await getFamilyEntitlements(connection.parentId);
  let updated;
  try {
    updated = await withSerializableTransaction(async (tx) => {
      const current = await tx.parentDriverConnection.findFirst({
        where: isParentSession
          ? { id, parentId: session.id }
          : { id, driverId: session.id },
      });
      if (!current) throw new Error("CONNECTION_NOT_FOUND");

      const parentCanApprove =
        isParentSession && current.status === "DRIVER_REQUESTED";
      const driverCanApprove =
        isDriverSession &&
        current.status === "INVITED" &&
        current.requestedBy === "parent";
      if (!parentCanApprove && !driverCanApprove) {
        throw new Error("CONNECTION_NOT_APPROVABLE");
      }

      await assertDriverConnectionApprovalAllowed(
        tx,
        resolved,
        current.parentId
      );
      return tx.parentDriverConnection.update({
        where: { id: current.id },
        data: {
          status: "PARENT_APPROVED",
          approvedAt: new Date(),
          revokedAt: null,
        },
      });
    });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    if (error instanceof Error && error.message === "CONNECTION_NOT_FOUND") {
      return NextResponse.json({ message: "Connection not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "CONNECTION_NOT_APPROVABLE") {
      return NextResponse.json(
        { message: "This connection is waiting for the other party" },
        { status: 400 }
      );
    }
    throw error;
  }

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
