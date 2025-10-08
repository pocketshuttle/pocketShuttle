"use server";
import db from "@/packages/db/client";
import { format, startOfWeek } from "date-fns";

export async function getWeeklyPickupStatsForBus(
  busId: string,
  termStart: Date,
  termEnd: Date
) {
  // 1. Get all students on the bus
  const bus = await db.buses.findUnique({
    where: { id: busId },
    include: { students: true }, // students in this bus
  });

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
  const weeklyGroups: Record<string, Record<string, number[]>> = {};

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

    const busAverage =
      studentAverages.reduce((a, b) => a + b.avgMinutes, 0) /
      studentAverages.length;

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

      busAverage: `${String(Math.floor(busAverage / 60)).padStart(2, "0")}:${String(
        Math.round(busAverage % 60)
      ).padStart(2, "0")}`,
    };
  });

  return weeklyStats;
}

export async function getWeeklyLatePickupStats(
  busId: string,
  termStart: Date,
  termEnd: Date
) {
  // 1. Get all students on the bus
  const bus = await db.buses.findUnique({
    where: { id: busId },
    include: { students: true },
  });

  if (!bus) throw new Error("Bus not found");

  const studentIds = bus.students.map((s) => s.id);

  // 2. Fetch all pickups with both arrival and pickup times
  const pickups = await db.pickup.findMany({
    where: {
      studentId: { in: studentIds },
      pickUpTime: { gte: termStart, lte: termEnd },
      arrivalTime: { not: null },
    },
    include: { Student: true },
    orderBy: { pickUpTime: "asc" },
  });

  // 3. Group by week and calculate late pickups
  const weeklyGroups: Record<
    string,
    {
      totalPickups: number;
      latePickups: number;
      lateStudents: Set<string>;
      totalStudents: Set<string>;
    }
  > = {};

  pickups.forEach((pickup) => {
    if (!pickup.arrivalTime || !pickup.pickUpTime) return;

    const date = new Date(pickup.pickUpTime);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    const weekKey = format(
      startOfWeek(date, { weekStartsOn: 1 }),
      "yyyy-MM-dd"
    );

    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = {
        totalPickups: 0,
        latePickups: 0,
        lateStudents: new Set(),
        totalStudents: new Set(),
      };
    }

    // Calculate time difference in minutes
    const arrivalTime = new Date(pickup.arrivalTime);
    const pickupTime = new Date(pickup.pickUpTime);
    const timeDifferenceMinutes =
      (pickupTime.getTime() - arrivalTime.getTime()) / (1000 * 60);

    console.log(timeDifferenceMinutes, "timeDifferenceMinutes");
    weeklyGroups[weekKey].totalPickups++;
    weeklyGroups[weekKey].totalStudents.add(pickup.studentId);

    // Check if pickup was more than 5 minutes after arrival
    if (timeDifferenceMinutes > 5) {
      weeklyGroups[weekKey].latePickups++;
      weeklyGroups[weekKey].lateStudents.add(pickup.studentId);
    }
  });

  // 4. Calculate weekly statistics
  const weeklyLateStats = Object.entries(weeklyGroups).map(([week, data]) => {
    const latePercentage =
      data.totalPickups > 0
        ? Math.round((data.latePickups / data.totalPickups) * 100)
        : 0;

    const lateStudentsPercentage =
      data.totalStudents.size > 0
        ? Math.round((data.lateStudents.size / data.totalStudents.size) * 100)
        : 0;

    return {
      week,
      totalPickups: data.totalPickups,
      latePickups: data.latePickups,
      lateStudents: data.lateStudents.size,
      totalStudents: data.totalStudents.size,
      latePickupPercentage: latePercentage,
      lateStudentsPercentage: lateStudentsPercentage,
      onTimePercentage: 100 - latePercentage,
    };
  });

  return weeklyLateStats;
}

export async function getLateStudentDetails(
  busId: string,
  termStart: Date,
  termEnd: Date
) {
  // 1. Get all students on the bus
  const bus = await db.buses.findUnique({
    where: { id: busId },
    include: { students: true },
  });

  if (!bus) throw new Error("Bus not found");

  const studentIds = bus.students.map((s) => s.id);

  // 2. Fetch all pickups with both arrival and pickup times
  const pickups = await db.pickup.findMany({
    where: {
      studentId: { in: studentIds },
      pickUpTime: { gte: termStart, lte: termEnd },
      arrivalTime: { not: null },
    },
    include: {
      Student: {
        include: {
          parent: {
            select: {
              full_name: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { pickUpTime: "asc" },
  });

  // 3. Filter and process late pickups
  const lateStudents = pickups
    .filter((pickup) => {
      if (!pickup.arrivalTime || !pickup.pickUpTime) return false;

      const date = new Date(pickup.pickUpTime);
      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;

      // Calculate time difference in minutes
      const arrivalTime = new Date(pickup.arrivalTime);
      const pickupTime = new Date(pickup.pickUpTime);
      const timeDifferenceMinutes =
        (pickupTime.getTime() - arrivalTime.getTime()) / (1000 * 60);

      return timeDifferenceMinutes > 5;
    })
    .map((pickup) => {
      const arrivalTime = new Date(pickup.arrivalTime!);
      const pickupTime = new Date(pickup.pickUpTime);
      const timeDifferenceMinutes =
        (pickupTime.getTime() - arrivalTime.getTime()) / (1000 * 60);

      return {
        studentId: pickup.studentId,
        studentName: pickup.Student.full_name,
        studentImage: pickup.Student.image,
        parentName: pickup.Student.parent?.full_name || "N/A",
        parentPhone: pickup.Student.parent?.phoneNumber || "N/A",
        parentEmail: pickup.Student.parent?.email || "N/A",
        lateDifferenceMinutes: Math.round(timeDifferenceMinutes),
        pickupDate: pickup.pickUpTime,
      };
    });

  // 4. Group by student and get the latest late pickup for each student
  const studentMap = new Map();
  lateStudents.forEach((student) => {
    const existing = studentMap.get(student.studentId);
    if (!existing || student.pickupDate > existing.pickupDate) {
      studentMap.set(student.studentId, student);
    }
  });

  return Array.from(studentMap.values());
}
