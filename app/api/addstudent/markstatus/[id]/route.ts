import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type ParamsProps = {
  id: string;
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: ParamsProps }
) => {
  try {
    const { id } = params;
    const data = await req.json();

    console.log(data.attendance, "status");
    if (!data) {
      return NextResponse.json(
        { message: "No data provided" },
        { status: 400 }
      );
    }

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: {
        status: data.attendance,
      },
    });

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
