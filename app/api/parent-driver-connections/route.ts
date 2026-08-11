import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getApiSession } from "@/lib/api-auth";
import { markDriverActive } from "@/lib/driver-activity";
import { sendKnownDriverRealtimeEvent } from "@/lib/known-driver-network";
import db from "@/packages/db/client";
import {
  getFamilyEntitlements,
} from "@/lib/billing/entitlements";
import { assertDriverConnectionMutationAllowed } from "@/lib/billing/family-limits";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import { withSerializableTransaction } from "@/lib/prisma-transactions";

export async function GET() {
  const session = await getApiSession();
  if (!session || !["parent", "driver"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.parentDriverConnection.findMany({
    where: session.role === "parent" ? { parentId: session.id } : { driverId: session.id },
    include: {
      parent: {
        select: {
          id: true,
          full_name: true,
          phoneNumber: true,
          image: true,
          billingAccount: {
            select: {
              customPlaces: { where: { isActive: true }, orderBy: { name: "asc" } },
              tripTemplates: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
            },
          },
        },
      },
      driver: {
        select: {
          id: true,
          full_name: true,
          phoneNumber: true,
          image: true,
          liveAddress: true,
          verificationStatus: true,
          shareProfile: { select: { shareId: true } },
        },
      },
      assignments: {
        where: session.role === "driver" ? { status: "ACTIVE" } : undefined,
        include: {
          child: session.role === "driver"
            ? { select: { id: true, fullName: true, age: true, grade: true, address: true, image: true } }
            : true,
          events: {
            where: {
              eventType: { in: ["ON_THE_WAY_TO_SCHOOL", "PICKED_UP", "DROPPED_OFF"] },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const driverIds = Array.from(new Set(connections.map((connection) => connection.driver.id)));
  const driverActivityRows = driverIds.length
    ? await db.$queryRaw<Array<{ id: string; lastActiveAt: Date | null }>>`
        SELECT "id", "last_active_at" AS "lastActiveAt"
        FROM "Driver"
        WHERE "id" IN (${Prisma.join(driverIds)})
      `
    : [];
  const driverActivityById = new Map(driverActivityRows.map((row) => [row.id, row.lastActiveAt]));

  const response = connections.map((connection) => {
    const driverApproved = session.role === "driver" && connection.status === "PARENT_APPROVED";
    const { billingAccount, ...parent } = connection.parent;
    return {
      ...connection,
      parent,
      driver: {
        ...connection.driver,
        lastActiveAt: driverActivityById.get(connection.driver.id) ?? null,
      },
      assignments:
        session.role === "driver" && connection.status !== "PARENT_APPROVED"
          ? []
          : connection.assignments,
      customPlaces: driverApproved ? billingAccount?.customPlaces ?? [] : [],
      tripTemplates: driverApproved ? billingAccount?.tripTemplates ?? [] : [],
    };
  });

  return NextResponse.json({ connections: response });
}

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session || !["parent", "driver"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parentId = session.role === "parent" ? session.id : String(body.parentId || "");
  const driverId = session.role === "driver" ? session.id : String(body.driverId || "");

  if (!parentId || !driverId) {
    return NextResponse.json({ message: "Parent and driver are required" }, { status: 400 });
  }

  const [parent, driver] = await Promise.all([
    db.parent.findFirst({
      where: { id: parentId, accountType: "STANDALONE", schoolId: null },
      select: { id: true },
    }),
    db.driver.findFirst({
      where: { id: driverId, accountType: "STANDALONE", schoolId: null },
      select: { id: true },
    }),
  ]);

  if (!parent || !driver) {
    return NextResponse.json({ message: "Parent or driver not found" }, { status: 404 });
  }

  const status = session.role === "driver" ? "DRIVER_REQUESTED" : "INVITED";
  const resolved = await getFamilyEntitlements(parentId);
  let connection;
  try {
    connection = await withSerializableTransaction(async (tx) => {
      await assertDriverConnectionMutationAllowed(
        tx,
        resolved,
        parentId,
        driverId
      );
      return tx.parentDriverConnection.upsert({
        where: { parentId_driverId: { parentId, driverId } },
        create: {
          parentId,
          driverId,
          status,
          requestedBy: session.role,
          note: typeof body.note === "string" ? body.note : null,
        },
        update: {
          status,
          requestedBy: session.role,
          revokedAt: null,
          note: typeof body.note === "string" ? body.note : undefined,
        },
      });
    });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    throw error;
  }

  await sendKnownDriverRealtimeEvent({ parentId, driverId, event: "connection-updated" });
  if (session.role === "driver") {
    await markDriverActive(session.id);
  }

  return NextResponse.json({ message: "Connection request saved", connection }, { status: 201 });
}
