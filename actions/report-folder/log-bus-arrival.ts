"use server";

import { db } from "@/lib/db";

export async function logBusArrival(
  studentId: string,
  teacherId: string,
  parentId: string
) {
  return await db.pickup.create({
    data: {
      studentId,
      teacherId,
      parentId,
      arrivalTime: new Date(),
    },
  });
}
