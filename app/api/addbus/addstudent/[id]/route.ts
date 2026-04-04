import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { revalidateTag } from "next/cache";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

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
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

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

    if (studentId && studentId !== id) {
      return NextResponse.json(
        { message: "Student ID mismatch" },
        { status: 400 }
      );
    }

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

    if (!student || student.schoolId !== schoolId) {
      return NextResponse.json(
        { message: "Student not found in your school" },
        { status: 404 }
      );
    }

    const bus = await db.buses.findFirst({
      where: { id: busId, schoolId },
      select: { id: true },
    });

    if (!bus) {
      return NextResponse.json(
        { message: "Bus not found in your school" },
        { status: 404 }
      );
    }

    if (student.bus && student.bus.id === busId) {
      return NextResponse.json(
        {
          message: "Student is already in this bus",
        },
        { status: 400 }
      );
    }

    await db.buses.update({
      where: { id: busId },
      data: {
        students: {
          connect: {
            id,
          },
        },
      },
    });

    await db.student.update({
      where: { id },
      data: { busId },
    });

    revalidateTag("students");

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
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const data = await req.json();
    const { studentId, busId } = data.attendance;

    if (studentId && studentId !== id) {
      return NextResponse.json(
        { message: "Student ID mismatch" },
        { status: 400 }
      );
    }

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

    if (!bus || bus.schoolId !== schoolId) {
      return NextResponse.json(
        {
          message: "Bus not found in your school",
        },
        { status: 404 }
      );
    }

    if (!student || student.schoolId !== schoolId) {
      return NextResponse.json(
        {
          message: "Student not found in your school",
        },
        { status: 404 }
      );
    }

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
