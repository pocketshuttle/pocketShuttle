import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    //we decrease the available car seat when a student is picked
    if (updatedStudent.status === "PICKED" && updatedStudent.busId) {
      await db.buses.update({
        where: { id: updatedStudent.busId },
        data: {
          seat_number: {
            decrement: 1,
          },
        },
      });
      //we increase the available car seat when a student is dropped
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

    //from 6am-9am picked student should be in bus or in school
    if (updatedStudent.status === "PICKED" && hours >= 6 && hours < 9) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "IN_BUS",
        },
      });

      //from 9am-4pm picked student should be in school
    } else if (updatedStudent.status === "PICKED" && hours >= 9 && hours < 16) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "AT_SCHOOL",
        },
      });

      //from 5pm-7pm picked student should be all dropped at home
    } else if (
      updatedStudent.status === "DROPPED" &&
      hours >= 17 &&
      hours < 19
    ) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "NONE",
        },
      });
    } else if (updatedStudent.status === "DROPPED" && hours > 19) {
      await db.student.update({
        where: { id: id },
        data: {
          presence: "NONE",
          status: "DROPPED",
          attendance: "ABSENT",
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
