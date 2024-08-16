"use server";

import Buses from "@/(models)/Bus";
import Driver from "@/(models)/Driver";
import Teacher from "@/(models)/Teachers";
import User from "@/(models)/User";
import { db } from "@/lib/db";
import { connectToDB } from "@/utils/connect-to-db";
import { NextResponse } from "next/server";

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
