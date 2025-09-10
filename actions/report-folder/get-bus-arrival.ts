import { StudentProps } from "@/types";
import { logBusArrival } from "./log-bus-arrival";
import haversine from "haversine-distance";

export async function checkBusArrival(
  busCoords: [number, number],
  studentCoords: [number, number],
  student: StudentProps,
  teacherId: string
): Promise<boolean> {
  if (!busCoords || !studentCoords) return false;

  const distance = haversine(
    { lat: busCoords[0], lng: busCoords[1] },
    { lat: studentCoords[0], lng: studentCoords[1] }
  );

  if (distance <= 100) {
    await logBusArrival(student.id, teacherId, student?.parentId || "");
    return true;
  }

  return false;
}
