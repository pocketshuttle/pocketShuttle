"use server";

import { db } from "@/lib/db";
import { format, startOfWeek } from "date-fns";

export const getTeacherPickupCount = async (
  teacherId: string,
  termStart: Date,
  termEnd: Date
) => {
  // 1. Get all pickups for this teacher in range
  const pickups = await db.pickup.findMany({
    where: {
      teacherId,
      pickUpTime: { gte: termStart, lte: termEnd },
    },
    orderBy: { pickUpTime: "asc" },
  });

  //group by week and by day
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

    //skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    //week keys
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

  // Format into array for easier charting
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
