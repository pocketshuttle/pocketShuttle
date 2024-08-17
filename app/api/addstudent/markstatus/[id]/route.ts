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

    if (updatedStudent.status === "PICKED" && updatedStudent.busId) {
      await db.buses.update({
        where: { id: updatedStudent.busId },
        data: {
          seat_number: {
            decrement: 1,
          },
        },
      });
    } else if (updatedStudent.status === "DROPPED" && updatedStudent.busId) {
      await db.buses.update({
        where: { id: updatedStudent.busId },
        data: {
          seat_number: {
            increment: 1,
          },
        },
      });
    }




    
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
