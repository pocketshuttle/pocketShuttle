import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { canManageStudentRecords, getApiSession } from "@/lib/api-auth";
import { applyStudentAttendanceUpdate } from "@/lib/student-state";

type ParamsProps = {
  id: string;
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<ParamsProps> }
) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageStudentRecords(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    if (!data || !data.attendance) {
      return NextResponse.json(
        { message: "Invalid data provided" },
        { status: 400 }
      );
    }

    const result = await applyStudentAttendanceUpdate(
      { studentId: id, schoolId },
      data.attendance
    );
    if (!result) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: result.changed
          ? "Attendance updated successfully"
          : `Attendance is already ${result.student.attendance}`,
        student: result.student,
      },
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
