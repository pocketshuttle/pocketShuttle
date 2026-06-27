"use server";
import { StudentProps } from "@/types";
import { logBusArrival } from "./log-bus-arrival";
import haversine from "haversine-distance";
import db from "@/packages/db/client";
import { canManageStudentRecords, getApiSession } from "@/lib/api-auth";

export async function checkBusArrival(
  busCoords: [number, number],
  studentCoords: [number, number],
  student: StudentProps,
  teacherId: string
): Promise<boolean> {
  const session = await getApiSession();
  if (!canManageStudentRecords(session) || !session.schoolId) return false;
  if (!busCoords || !studentCoords) return false;

  const scopedStudent = await db.student.findFirst({
    where: {
      id: student.id,
      schoolId: session.schoolId,
      ...(session.role === "teacher" ? { teacherId: session.id } : {}),
    },
    select: {
      id: true,
      full_name: true,
      parentId: true,
    },
  });

  if (!scopedStudent) return false;

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
      studentId: scopedStudent.id,
      teacherId: teacherId,
      arrivalTime: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (existingArrival) {
    return false;
  }

  const distance = haversine(
    { lat: busCoords[0], lng: busCoords[1] },
    { lat: studentCoords[0], lng: studentCoords[1] }
  );

  if (distance <= 100) {
    await logBusArrival(scopedStudent.id, teacherId, scopedStudent.parentId || "");
    return true;
  }

  return false;
}
