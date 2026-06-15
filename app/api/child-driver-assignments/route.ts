import { NextRequest, NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import {
  getOneMonthFrom,
  KNOWN_DRIVER_MONTHLY_AMOUNT,
  sendKnownDriverRealtimeEvent,
} from "@/lib/known-driver-network";
import db from "@/packages/db/client";

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const connectionId = String(body.connectionId || "");
  const childIds = Array.isArray(body.childIds)
    ? body.childIds.map(String).filter(Boolean)
    : [String(body.childId || "")].filter(Boolean);
  const monthlyAmount =
    typeof body.monthlyAmount === "number"
      ? body.monthlyAmount
      : KNOWN_DRIVER_MONTHLY_AMOUNT || null;

  if (!connectionId || !childIds.length) {
    return NextResponse.json(
      { message: "Connection and at least one child are required" },
      { status: 400 }
    );
  }

  const connection = await db.parentDriverConnection.findFirst({
    where: {
      id: connectionId,
      parentId: session.id,
      status: "PARENT_APPROVED",
    },
  });

  if (!connection) {
    return NextResponse.json(
      { message: "Approved driver connection not found" },
      { status: 404 }
    );
  }

  const children = await db.parentChild.findMany({
    where: {
      id: { in: childIds },
      parentId: session.id,
    },
    select: { id: true },
  });

  if (children.length !== childIds.length) {
    return NextResponse.json(
      { message: "One or more children were not found" },
      { status: 404 }
    );
  }

  const now = new Date();
  const trialEndsAt = getOneMonthFrom(now);

  const assignments = await db.$transaction(
    children.map((child) =>
      db.childDriverAssignment.upsert({
        where: {
          childId_driverId: {
            childId: child.id,
            driverId: connection.driverId,
          },
        },
        create: {
          parentId: session.id,
          driverId: connection.driverId,
          childId: child.id,
          connectionId: connection.id,
          status: "ACTIVE",
          billingStatus: "FREE_TRIAL",
          monthlyAmount,
          trialStartedAt: now,
          trialEndsAt,
        },
        update: {
          connectionId: connection.id,
          status: "ACTIVE",
          billingStatus: "FREE_TRIAL",
          monthlyAmount,
          trialStartedAt: now,
          trialEndsAt,
        },
        include: {
          child: true,
          driver: {
            select: {
              id: true,
              full_name: true,
              phoneNumber: true,
              image: true,
              verificationStatus: true,
              shareProfile: { select: { shareId: true } },
            },
          },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      })
    )
  );

  await sendKnownDriverRealtimeEvent({
    parentId: session.id,
    driverId: connection.driverId,
    event: "assignments-updated",
  });

  return NextResponse.json(
    { message: "Child assignment saved", assignments },
    { status: 201 }
  );
}
