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
      school_id,
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
      school_id,
      full_name,
      email,
      phoneNumber,
      busId,
      address,
      students: studentId ? [studentId] : [],
      image,
      password: hashedPassword,
    });

    await newTeacher.save();

    return Response.json(
      { message: "Teacher added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding driver:", error);
    return NextResponse.json(
      {
        message: "Error adding Teacher",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
