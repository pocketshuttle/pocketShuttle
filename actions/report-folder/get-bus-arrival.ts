"use server";
import { StudentProps } from "@/types";
import { logBusArrival } from "./log-bus-arrival";
import haversine from "haversine-distance";
import { db } from "@/lib/db";

export async function checkBusArrival(
  busCoords: [number, number],
  studentCoords: [number, number],
  student: StudentProps,
  teacherId: string
): Promise<boolean> {
  if (!busCoords || !studentCoords) return false;

  // Check if arrival has already been logged today
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

  const existingArrival = await db.pickup.findFirst({
    where: {
      studentId: student.id,
      teacherId: teacherId,
      arrivalTime: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (existingArrival) {
    console.log(`Arrival already logged for ${student.full_name} today`);
    return false;
  }

  // const distance = haversine(
  //   { lat: busCoords[0], lng: busCoords[1] },
  //   { lat: studentCoords[0], lng: studentCoords[1] }
  // );
  
  const distance = 70;

  console.log(distance, "distance from bus arrival");

  if (distance <= 100) {
    await logBusArrival(student.id, teacherId, student?.parentId || "");
    return true;
  }

  return false;
}
