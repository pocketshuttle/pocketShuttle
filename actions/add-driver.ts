"use server";

import db from "@/packages/db/client";

export const addDriver = async (id: string, busId: string) => {
  try {
    if (!id || !busId) {
      return {
        message: "Both studentId and busId are required",
      };
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
