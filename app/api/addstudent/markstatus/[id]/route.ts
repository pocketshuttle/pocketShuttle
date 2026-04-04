import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import db from "@/packages/db/client";
import { canManageStudentRecords, getApiSession } from "@/lib/api-auth";

type ParamsProps = {
  id: string;
};

function getCurrentHourInTimeZone(timezone: string): number {
  const date = new Date();
  const tz = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return tz.getHours();
}

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

    if (!data) {
      return NextResponse.json(
        { message: "No data provided" },
        { status: 400 }
      );
    }

    const existingStudent = await db.student.findFirst({
      where: { id, schoolId },
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
        status: data.attendance,
      },
    });
    revalidateTag("students");

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

    const hours = getCurrentHourInTimeZone("Africa/Lagos");

    if (updatedStudent.status === "PICKED" && hours >= 6 && hours < 9) {
      await db.student.update({
        where: { id },
        data: {
          presence: "IN_BUS",
        },
      });
    } else if (updatedStudent.status === "PICKED" && hours >= 9 && hours < 16) {
      await db.student.update({
        where: { id },
        data: {
          presence: "AT_SCHOOL",
        },
      });
    } else if (
      updatedStudent.status === "DROPPED" &&
      hours >= 17 &&
      hours < 19
    ) {
      await db.student.update({
        where: { id },
        data: {
          presence: "NONE",
        },
      });
    } else if (updatedStudent.status === "DROPPED" && hours > 19) {
      await db.student.update({
        where: { id },
        data: {
          presence: "NONE",
          status: "DROPPED",
          attendance: "ABSENT",
        },
      });
    }

    return NextResponse.json(
      { message: "Student updated successfully" },
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
