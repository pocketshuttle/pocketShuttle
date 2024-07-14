import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";
import { StudentSchema } from "@/schemas";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    const validatedData = StudentSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    const {
      creator,
      full_name,
      age,
      address,
      image,
      busId,
      parentId,
      teacherId,
      grade,
    } = validatedData.data;

    const newStudent = new Student({
      creator,
      full_name,
      age,
      bus: busId,
      parent: parentId,
      teacher: teacherId,
      grade,
      address,
      image,
    });

    await newStudent.save();

    return Response.json({ message: "Student added Succesfully " });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { message: "Error adding Student", error: error.message },
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
