import "server-only";

import { Prisma } from "@prisma/client";

import {
  assertWithinLimit,
  ResolvedEntitlements,
} from "@/lib/billing/entitlements";
import {
  DRIVER_SLOT_STATUSES,
  driverSlotIncrement,
} from "@/lib/billing/policy";

export async function assertDriverConnectionMutationAllowed(
  tx: Prisma.TransactionClient,
  resolved: ResolvedEntitlements,
  parentId: string,
  driverId: string
) {
  const [existing, connectionCount] = await Promise.all([
    tx.parentDriverConnection.findUnique({
      where: { parentId_driverId: { parentId, driverId } },
      select: { status: true },
    }),
    tx.parentDriverConnection.count({
      where: { parentId, status: { in: [...DRIVER_SLOT_STATUSES] } },
    }),
  ]);

  assertWithinLimit(
    resolved,
    "max_connected_drivers",
    connectionCount,
    driverSlotIncrement(existing?.status)
  );
}

export async function assertDriverConnectionApprovalAllowed(
  tx: Prisma.TransactionClient,
  resolved: ResolvedEntitlements,
  parentId: string
) {
  const connectionCount = await tx.parentDriverConnection.count({
    where: { parentId, status: { in: [...DRIVER_SLOT_STATUSES] } },
  });
  assertWithinLimit(
    resolved,
    "max_connected_drivers",
    connectionCount,
    0
  );
}
