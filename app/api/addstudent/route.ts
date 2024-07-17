import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";
import { StudentSchema } from "@/schemas";

export const POST = async (req: NextRequest) => {
  console.log("Hello");
  try {
    await connectToDB();
    const data = await req.json();
    console.log(data);
    const validatedData = StudentSchema.safeParse(data);

    if (!validatedData.success) {
      console.log(validatedData.error.errors);
      return Response.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    const {
      school_id,
      full_name,
      age,
      image,
      busId,
      parentId,
      teacherId,
      address,
      grade,
      gender,
    } = validatedData.data;

    const newStudent = new Student({
      school_id,
      full_name,
      age,
      bus: busId,
      parent: parentId,
      teacher: teacherId,
      grade,
      address,
      image,
      gender,
    });

    await newStudent.save();

    return Response.json(
      { message: "Student added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error("Error adding driver:", error);
    return NextResponse.json(
      {
        message: "Error adding driver",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
