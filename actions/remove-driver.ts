"use server";

import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";

export const removeDriverFromBus = async (driverId: string, busId: string) => {
  console.log(driverId, busId, "ids ");
  try {
    const user = await getUserSession();
    if (!user || !["teacher", "admin", "ADMIN"].includes(user.role as string)) {
      return { message: "Unauthorized", status: 401 };
    }

    if (!driverId || !busId) {
      return {
        message: "Both studentId and busId are required",
      };
    }
    const driver = await db.driver.findUnique({
      where: { id: driverId },
    });
    const bus = await db.buses.findUnique({
      where: { id: busId },
    });

    if (!driver || !bus) {
      return { message: "Teacher or Bus not found" };
    }

    await db.driver.update({
      where: { id: driverId },
      data: { busId: null },
    });

    await db.buses.update({
      where: { id: busId },
      data: {
        driver: {
          disconnect: { id: driverId },
        },
      },
    });

    return { message: "Driver removed from bus" };
  } catch (error) {
    console.error("Error updating Bus:", error);
    return { message: "Error updating Bus" };
  }
};
