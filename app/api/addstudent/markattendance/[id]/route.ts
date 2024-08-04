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

    console.log("bus data", data);

    if (!data) {
      return NextResponse.json(
        { message: "No data provided" },
        { status: 400 }
      );
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { attendance: data.attendance },
      { new: true, useFindAndModify: false }
    );

    if (!updatedStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Attendance updated successfully", student: updatedStudent },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating attendance:", error);

    return NextResponse.json(
      {
        message: "Error updating attendance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
