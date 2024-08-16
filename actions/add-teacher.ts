"use server";

import Buses from "@/(models)/Bus";
import Teacher from "@/(models)/Teachers";
import User from "@/(models)/User";
import { db } from "@/lib/db";
import { connectToDB } from "@/utils/connect-to-db";
import { NextResponse } from "next/server";

export const addTeacher = async (id: string, busId: string) => {
  try {
    const teacher = await db.teacher.findUnique({
      where: {
        id,
      },
      include: {
        bus: true,
      },
    });

    // console.log("busID", busId);
    if (!teacher) {
      return { message: "Teacher not found" };
    }

    await db.buses.update({
      where: { id: busId },
      data: {
        teacher: {
          connect: { id: id },
        },
      },
    });

    await db.teacher.update({
      where: { id },
      data: { busId },
    });

    return { message: "Teacher added to bus" };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { message: "Error updating attendance" };
  }
};
