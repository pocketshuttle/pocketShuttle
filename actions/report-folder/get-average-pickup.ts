"use server";
import { getApiSession, canManageSchool } from "@/lib/api-auth";
import db from "@/packages/db/client";
import { format, startOfWeek } from "date-fns";

function normalizeDateRange(termStart: Date, termEnd: Date) {
  const start = new Date(termStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(termEnd);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function getScopedBus(busId: string) {
  const session = await getApiSession();
  if (!canManageSchool(session) || !session.schoolId) {
    throw new Error("Unauthorized");
  }

  const bus = await db.buses.findFirst({
    where: { id: busId, schoolId: session.schoolId },
    include: { students: true },
  });

  if (!bus) throw new Error("Bus not found");

  return bus;
}

export async function getWeeklyPickupStatsForBus(
  busId: string,
  termStart: Date,
  termEnd: Date
) {
  const bus = await getScopedBus(busId);
  const { start, end } = normalizeDateRange(termStart, termEnd);

  const studentIds = bus.students.map((s) => s.id);

  const pickups = await db.pickup.findMany({
    where: {
      studentId: { in: studentIds },
      pickUpTime: { gte: start, lte: end },
    },
    include: { Student: true },
    orderBy: { pickUpTime: "asc" },
  });

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
  const bus = await getScopedBus(busId);
  const { start, end } = normalizeDateRange(termStart, termEnd);

  const studentIds = bus.students.map((s) => s.id);

  const pickups = await db.pickup.findMany({
    where: {
      studentId: { in: studentIds },
      pickUpTime: { gte: start, lte: end },
      arrivalTime: { not: null },
    },
    include: { Student: true },
    orderBy: { pickUpTime: "asc" },
  });

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

    const arrivalTime = new Date(pickup.arrivalTime);
    const pickupTime = new Date(pickup.pickUpTime);
    const timeDifferenceMinutes =
      (pickupTime.getTime() - arrivalTime.getTime()) / (1000 * 60);

    weeklyGroups[weekKey].totalPickups++;
    weeklyGroups[weekKey].totalStudents.add(pickup.studentId);

    if (timeDifferenceMinutes > 5) {
      weeklyGroups[weekKey].latePickups++;
      weeklyGroups[weekKey].lateStudents.add(pickup.studentId);
    }
  });

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
  const bus = await getScopedBus(busId);
  const { start, end } = normalizeDateRange(termStart, termEnd);

  const studentIds = bus.students.map((s) => s.id);

  const pickups = await db.pickup.findMany({
    where: {
      studentId: { in: studentIds },
      pickUpTime: { gte: start, lte: end },
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

  const lateStudents = pickups
    .filter((pickup) => {
      if (!pickup.arrivalTime || !pickup.pickUpTime) return false;

      const date = new Date(pickup.pickUpTime);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;

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

  const studentMap = new Map();
  lateStudents.forEach((student) => {
    const existing = studentMap.get(student.studentId);
    if (!existing || student.pickupDate > existing.pickupDate) {
      studentMap.set(student.studentId, student);
    }
  });

  return Array.from(studentMap.values());
}
