"use server";

import Buses from "@/(models)/Bus";
import Teacher from "@/(models)/Teachers";
import User from "@/(models)/User";
import { db } from "@/lib/db";
import { connectToDB } from "@/utils/connect-to-db";
import { NextResponse } from "next/server";

export const addTeacher = async (id: string, busId: string) => {
  try {
    console.log(id, busId);
    // const teacher = await Teacher.findById(id).populate("busId");
    const teacher = await db.teacher.findUnique({
      where: {
        id,
      },
      include: {
        Buses: true,
      },
    });

    // console.log("busID", busId);
    if (!teacher) {
      return { message: "Teacher not found" };
    }

    await db.buses.update({
      where: { id: busId },
      data: { teacherId: id },
    });

    await db.teacher.update({
      where: { id },
      data: { busId },
    });
    // await Buses.findByIdAndUpdate(
    //   busId,
    //   {
    //     teacher: id,
    //   },
    //   { new: true, useFindAndModify: false }
    // );
    // teacher.busId = busId;

    // await teacher.save();

    return { message: "Teacher added to bus" };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { message: "Error updating attendance" };
  }
};
