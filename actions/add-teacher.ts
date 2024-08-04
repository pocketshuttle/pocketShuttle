"use server";

import Buses from "@/(models)/Bus";
import Teacher from "@/(models)/Teachers";
import User from "@/(models)/User";
import { connectToDB } from "@/utils/connect-to-db";
import { NextResponse } from "next/server";

export const addTeacher = async (id: string, busId: string) => {
  try {
    await connectToDB();
    const teacher = await Teacher.findById(id).populate("busId");

    if (!teacher) {
      return { message: "Teacher not found" };
    }
    await Buses.findByIdAndUpdate(
      busId,
      {
        teacher: id,
      },
      { new: true, useFindAndModify: false }
    );
    teacher.busId = busId;

    await teacher.save();

    return { message: "Teacher added to bus" };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { message: "Error updating attendance" };
  }
};
