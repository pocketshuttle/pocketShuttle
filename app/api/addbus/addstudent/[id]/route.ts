import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";
import Buses from "@/(models)/Bus";

type ParamsProps = {
  id: string;
};
export const PATCH = async (
  req: NextRequest,
  { params }: { params: ParamsProps }
) => {
  try {
    await connectToDB();

    const { id } = params;
    const data = await req.json();

    if (!data) {
      return NextResponse.json(
        {
          message: "Student not found",
        },
        { status: 404 }
      );
    }
    const { studentId, busId } = data.attendance;

    if (busId) {
      // const student = await Buses.find({ student: studentId });
      await Student.findByIdAndUpdate(
        studentId,
        { bus: busId },
        { new: true, useFindAndModify: false }
      );
    }

    return NextResponse.json(
      { message: "Student added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding student", error);

    return NextResponse.json(
      {
        message: "Error adding student",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
