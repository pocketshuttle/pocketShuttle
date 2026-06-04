import "server-only";

import db from "@/packages/db/client";

type SessionLike = {
  id: string;
  role: string;
  schoolId?: string | null;
} | null;

export async function canAccessTrip(tripId: string, session: SessionLike) {
  if (!session?.id) {
    return false;
  }

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      schoolId: true,
      busId: true,
      driverId: true,
      createdBy: true,
      viewers: {
        where: {
          viewerId: session.id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!trip) {
    return false;
  }

  const role = session.role.toLowerCase();
  const schoolId = session.schoolId ?? (role === "admin" || role === "school" ? session.id : null);

  if (
    trip.createdBy === session.id ||
    trip.driverId === session.id ||
    trip.schoolId === schoolId ||
    trip.viewers.length > 0
  ) {
    return true;
  }

  if (!trip.busId) {
    return false;
  }

  const assignedBus = await db.buses.findFirst({
    where: {
      id: trip.busId,
      OR: [{ teacher: { id: session.id } }, { driver: { id: session.id } }],
    },
    select: { id: true },
  });

  return Boolean(assignedBus);
}
