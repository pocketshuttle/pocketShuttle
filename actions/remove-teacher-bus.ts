"use server";

import Buses from "@/(models)/Bus";
import Teacher from "@/(models)/Teachers";
import { connectToDB } from "@/utils/connect-to-db";

export const removeTeacherFromBus = async (
  teacherId: string,
  busId: string
) => {
  try {
    await connectToDB();
    console.log(teacherId, busId);

    const teacher = await Teacher.findById(teacherId).populate("busId");

    const bus = await Buses.findById(busId);

    if (!teacher) {
      return { message: "Teacher not found" };
    }
    if (!bus) {
      return { message: "Bus not found" };
    }
    if (!teacher) {
      return { message: "Teacher not found" };
    }

    teacher.busId = null;
    bus.teachher = null;

    await teacher.save();
    await bus.save();
    return { message: "Teacher removed from bus" };
  } catch (error) {
    console.error("Error updating Bus:", error);
    return { message: "Error updating Bus" };
  }
};
