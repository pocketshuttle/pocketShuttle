import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
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

    if (!data || !data.attendance) {
      return NextResponse.json(
        { message: "Invalid data provided" },
        { status: 400 }
      );
    }

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: {
        attendance: data.attendance,
        ...data,
      },
    });
    if (!updatedStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    revalidateTag("collection");

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
