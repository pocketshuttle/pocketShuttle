import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";
import Buses from "@/(models)/Bus";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
        {
          message: "Student not found",
        },
        { status: 404 }
      );
    }
    const { studentId, busId } = data.attendance;

    if (!studentId || !busId) {
      return NextResponse.json(
        {
          message: "Both studentId and busId are required",
        },
        { status: 400 }
      );
    }
    const student = await db.student.findUnique({
      where: { id },
      include: {
        bus: true,
      },
    });

    // const student = await Student.findById(studentId).populate("bus");

    if (student?.bus && student?.bus.id.toString() === busId) {
      return NextResponse.json(
        {
          message: "Student is already in this bus",
        },
        { status: 400 }
      );
    }

    await db.buses.update({
      where: { id: busId },
      data: { studentId: id },
    });

    await db.student.update({
      where: { id },
      data: { busId },
    });

    const path = req.nextUrl.pathname;

    console.log(path, "apth");

    // revalidatePath(path);

    return NextResponse.json(
      { message: "Student added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding student", error);

    return NextResponse.json(
      {
        message: "Error adding student",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: ParamsProps }
) => {
  try {
    const data = await req.json();

    const { studentId, busId } = data.attendance;

    if (!studentId || !busId) {
      return NextResponse.json(
        {
          message: "Both studentId and busId are required",
        },
        { status: 400 }
      );
    }

    const bus = await db.buses.findUnique({
      where: { id: busId },
    });
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!bus) {
      return NextResponse.json(
        {
          message: "Bus not found",
        },
        { status: 404 }
      );
    }

    if (!student) {
      return NextResponse.json(
        {
          message: "Student not found",
        },
        { status: 404 }
      );
    }

    // Remove the bus reference from the student document
    await db.buses.update({
      where: { id: busId },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });
    await db.student.update({
      where: { id: studentId },
      data: { busId: null },
    });

    return NextResponse.json(
      { message: "Student removed from bus successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing student from bus:", error);

    return NextResponse.json(
      {
        message: "Error removing student from bus",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
