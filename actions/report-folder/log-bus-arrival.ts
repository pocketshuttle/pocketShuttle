"use server";

import db from "@/packages/db/client";

export async function logBusArrival(
  studentId: string,
  teacherId: string,
  parentId: string
) {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const existingPickup = await db.pickup.findFirst({
    where: {
      studentId,
      teacherId,
      OR: [
        { pickUpTime: { gte: startOfDay, lt: endOfDay } },
        { arrivalTime: { gte: startOfDay, lt: endOfDay } },
      ],
    },
    orderBy: { pickUpTime: "desc" },
  });

  if (existingPickup) {
    return await db.pickup.update({
      where: { id: existingPickup.id },
      data: {
        arrivalTime: existingPickup.arrivalTime ?? new Date(),
        parentId: existingPickup.parentId || parentId,
      },
    });
  }

  return await db.pickup.create({
    data: {
      studentId,
      teacherId,
      parentId,
      arrivalTime: new Date(),
    },
  });
}
