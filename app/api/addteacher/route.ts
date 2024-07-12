import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Teacher from "@/(models)/Teachers";
import { TeacherSchema } from "@/schemas";
import bcrypt from "bcryptjs";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    const validatedData = TeacherSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    const {
      userId,
      full_name,
      email,
      phoneNumber,
      address,
      studentId,
      image,
      busId,
      password,
    } = validatedData.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = new Teacher({
      creator: userId,
      full_name,
      email,
      phoneNumber,
      bus: busId,
      address,
      students: studentId,
      image,
      password: hashedPassword,
    });

    await newTeacher.save();

    return Response.json({ message: "Teacher added Succesfully " });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { message: "Error adding Teacher", error: error.message },
        { status: 400 }
      );
    } else {
      return Response.json(
        { message: "Unknown error occurred" },
        { status: 400 }
      );
    }
  }
};
