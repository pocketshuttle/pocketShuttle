import "server-only";

import { getEntitlements } from "@/lib/billing/entitlements";
import db from "@/packages/db/client";

export async function getTripOwnerEntitlements(tripId: string) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { schoolId: true, createdBy: true },
  });
  if (!trip) return null;

  if (trip.schoolId) {
    return getEntitlements({
      id: trip.schoolId,
      role: "school",
      schoolId: trip.schoolId,
    });
  }

  if (!trip.createdBy) return null;
  const parent = await db.parent.findFirst({
    where: {
      id: trip.createdBy,
      accountType: "STANDALONE",
      schoolId: null,
    },
    select: { id: true },
  });
  if (!parent) return null;

  return getEntitlements({
    id: parent.id,
    role: "parent",
    schoolId: null,
  });
}
