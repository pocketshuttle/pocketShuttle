"use server";

import db from "@/packages/db/client";

export async function logMorningPickup(student: any, hours: number) {
  if (student.status === "PICKED") {
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

    // Find existing pickup record for today
    const existingPickup = await db.pickup.findFirst({
      where: {
        studentId: student.id,
        teacherId: student.bus?.teacher?.id ?? null,
        OR: [
          { pickUpTime: { gte: startOfDay, lt: endOfDay } },
          { arrivalTime: { gte: startOfDay, lt: endOfDay } },
        ],
      },
    });

    if (existingPickup) {
      // Update existing record with pickup time
      await db.pickup.update({
        where: { id: existingPickup.id },
        data: {
          pickUpTime: new Date(),
          confirmedBy: "TEACHER",
        },
      });
      console.log(`✅ Updated pickup time for ${student.full_name}`);
    } else {
      // Create new record if none exists
      await db.pickup.create({
        data: {
          studentId: student.id,
          pickUpTime: new Date(),
          teacherId: student.bus?.teacher?.id ?? null,
          parentId: student.parentId,
          confirmedBy: "TEACHER",
        },
      });
      console.log(`✅ Created new pickup record for ${student.full_name}`);
    }
  }
}
