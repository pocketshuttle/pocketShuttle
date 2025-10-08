"use server";
import db from "@/packages/db/client";
import { format, startOfWeek } from "date-fns";

export async function getWeeklyPickupStatsForBus(
  busId: string,
  termStart: Date,
  termEnd: Date
) {
  //   console.log(
  //     "Fetching weekly pickup stats for bus:",
  //     busId,
  //     "from",
  //     termStart,
  //     "to",
  //     termEnd
  //   );

  // 1. Get all students on the bus
  const bus = await db.buses.findUnique({
    where: { id: busId },
    include: { students: true }, // students in this bus
  });

  //   console.log("Bus data:", bus);

  if (!bus) throw new Error("Bus not found");

  const studentIds = bus.students.map((s) => s.id);

  // 2. Fetch all pickups for those students in the date range
  const pickups = await db.pickup.findMany({
    where: {
      studentId: { in: studentIds },
      pickUpTime: { gte: termStart, lte: termEnd },
    },
    include: { Student: true },
    orderBy: { pickUpTime: "asc" },
  });

  // 3. Group by week + student
  const weeklyGroups: Record<
    string, // weekKey
    Record<string, number[]> // studentId -> [pickupTimesInMinutes]
  > = {};

  pickups.forEach((pickup) => {
    const date = new Date(pickup.pickUpTime);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    const weekKey = format(
      startOfWeek(date, { weekStartsOn: 1 }),
      "yyyy-MM-dd"
    );
    const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();

    if (!weeklyGroups[weekKey]) weeklyGroups[weekKey] = {};
    if (!weeklyGroups[weekKey][pickup.studentId])
      weeklyGroups[weekKey][pickup.studentId] = [];

    weeklyGroups[weekKey][pickup.studentId].push(minutesSinceMidnight);
  });

  // 4. Compute averages per student per week
  const weeklyStats = Object.entries(weeklyGroups).map(([week, students]) => {
    const studentAverages = Object.entries(students).map(
      ([studentId, times]) => {
        const avgMinutes = times.reduce((a, b) => a + b, 0) / times.length;
        return { studentId, avgMinutes };
      }
    );

    // Find earliest + latest student
    const fastest = studentAverages.reduce((a, b) =>
      a.avgMinutes < b.avgMinutes ? a : b
    );
    const slowest = studentAverages.reduce((a, b) =>
      a.avgMinutes > b.avgMinutes ? a : b
    );

    return {
      week,
      averages: studentAverages.map((s) => ({
        studentId: s.studentId,
        averageTime: `${String(Math.floor(s.avgMinutes / 60)).padStart(
          2,
          "0"
        )}:${String(Math.round(s.avgMinutes % 60)).padStart(2, "0")}`,
      })),
      fastest: {
        studentId: fastest.studentId,
        time: `${String(Math.floor(fastest.avgMinutes / 60)).padStart(
          2,
          "0"
        )}:${String(Math.round(fastest.avgMinutes % 60)).padStart(2, "0")}`,
      },
      slowest: {
        studentId: slowest.studentId,
        time: `${String(Math.floor(slowest.avgMinutes / 60)).padStart(
          2,
          "0"
        )}:${String(Math.round(slowest.avgMinutes % 60)).padStart(2, "0")}`,
      },
    };
  });

  return weeklyStats;
}
