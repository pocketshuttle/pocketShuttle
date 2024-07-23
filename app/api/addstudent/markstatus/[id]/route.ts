import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";

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
        { message: "No data provided" },
        { status: 400 }
      );
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        status: data.attendance,
      },
      { new: true, useFindAndModify: false }
    );

    if (updatedStudent) {
      return NextResponse.json(
        { message: "Student updated successfully" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Status updated successfully", student: updatedStudent },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating status:", error);

    return NextResponse.json(
      {
        message: "Error updating status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
