import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import db from "@/packages/db/client";
import { canManageStudentRecords, getApiSession } from "@/lib/api-auth";

type ParamsProps = {
  id: string;
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: ParamsProps }
) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageStudentRecords(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const data = await req.json();

    if (!data || !data.attendance) {
      return NextResponse.json(
        { message: "Invalid data provided" },
        { status: 400 }
      );
    }

    const existingStudent = await db.student.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    const updatedStudent = await db.student.update({
      where: { id },
      data: {
        attendance: data.attendance,
      },
    });

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
