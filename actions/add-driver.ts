"use server";

import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";

export const addDriver = async (id: string, busId: string) => {
  try {
    const user = await getUserSession();

    if (!user || !["admin", "school", "ADMIN"].includes(user.role as string)) {
      return {
        message:
          "Unauthorized: Only admins or school staff can add Drivers to Buses.",
        status: 403,
      };
    }
    if (!id || !busId) {
      return {
        message: "Both studentId and busId are required",
      };
    }
    const schoolId = String(user.schoolId ?? user.id ?? "");
    const [driver, bus] = await Promise.all([
      db.driver.findFirst({
        where: { id, schoolId, accountType: "SCHOOL_MANAGED" },
        select: { id: true },
      }),
      db.buses.findFirst({
        where: { id: busId, schoolId },
        select: { id: true },
      }),
    ]);

    if (!driver || !bus) {
      return { message: "Driver or bus not found for this school", status: 404 };
    }

    await db.driver.update({
      where: {
        id: id,
      },
      data: {
        bus: {
          connect: { id: busId },
        },
      },
    });

    await db.buses.update({
      where: { id: busId },
      data: {
        driver: {
          connect: { id: id },
        },
      },
    });

    return { message: "Driver added to bus" };
  } catch (error) {
    console.error("Error updating driver:", error);
    return { message: "Error updating driver" };
  }
};
