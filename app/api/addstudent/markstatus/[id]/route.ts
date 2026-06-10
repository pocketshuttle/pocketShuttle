import { NextRequest, NextResponse } from "next/server";
import { StudentStatus } from "@/packages/db/client";
import { canManageStudentRecords, getApiSession } from "@/lib/api-auth";
import {
  applyStudentStatusUpdate,
  getCurrentHourInTimeZone,
} from "@/lib/student-state";

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

    if (!data) {
      return NextResponse.json(
        { message: "No data provided" },
        { status: 400 }
      );
    }

    const nextStatus = (data.status ?? data.attendance) as StudentStatus | undefined;
    if (!nextStatus) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      );
    }

    const hours = getCurrentHourInTimeZone("Africa/Lagos");
    const result = await applyStudentStatusUpdate(
      { studentId: id, schoolId },
      nextStatus,
      hours
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
          ? "Student updated successfully"
          : `Status is already ${result.student.status}`,
        student: result.student,
      },
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
