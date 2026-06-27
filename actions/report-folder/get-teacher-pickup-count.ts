"use server";

import { canManageSchool, getApiSession } from "@/lib/api-auth";
import db from "@/packages/db/client";
import { format, startOfWeek } from "date-fns";

function normalizeDateRange(termStart: Date, termEnd: Date) {
  const start = new Date(termStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(termEnd);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export const getTeacherPickupCount = async (
  teacherId: string,
  termStart: Date,
  termEnd: Date
) => {
  const session = await getApiSession();
  if (!canManageSchool(session) || !session.schoolId) {
    return { message: "Unauthorized", status: 401 };
  }

  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, schoolId: session.schoolId },
    select: { id: true },
  });

  if (!teacher) {
    return [];
  }

  const { start, end } = normalizeDateRange(termStart, termEnd);

  const pickups = await db.pickup.findMany({
    where: {
      teacherId,
      pickUpTime: { gte: start, lte: end },
    },
    orderBy: { pickUpTime: "asc" },
  });

  const weeklyRecord: Record<
    string,
    {
      daily: Record<string, number>;
      weeklyTotal: number;
    }
  > = {};

  pickups.forEach((pickup) => {
    if (!pickup.pickUpTime) return;
    const date = new Date(pickup.pickUpTime);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    const weekKey = format(
      startOfWeek(date, { weekStartsOn: 1 }),
      "yyyy-MM-dd"
    );

    const dayKey = format(date, "yyyy-MM-dd");

    if (!weeklyRecord[weekKey]) {
      weeklyRecord[weekKey] = { daily: {}, weeklyTotal: 0 };
    }

    if (!weeklyRecord[weekKey].daily[dayKey]) {
      weeklyRecord[weekKey].daily[dayKey] = 0;
    }

    weeklyRecord[weekKey].daily[dayKey] += 1;
    weeklyRecord[weekKey].weeklyTotal += 1;
  });

  const results = Object.entries(weeklyRecord).map(([week, data]) => ({
    week,
    daily: Object.entries(data.daily).map(([date, count]) => ({
      date,
      count,
    })),
    weeklyTotal: data.weeklyTotal,
  }));

  return results;
};
