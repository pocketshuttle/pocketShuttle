import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { BusSchema } from "@/schemas";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();
    const validatedData = BusSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const {
      bus_number,
      seat_number,
      teacher,
      student,
      color,
      bus_product_name,
      route,
    } = validatedData.data;

    const routeRecord = await db.route.findFirst({
      where: { id: route, schoolId },
      select: { id: true },
    });

    if (!routeRecord) {
      return NextResponse.json(
        { message: "Route not found in your school" },
        { status: 400 }
      );
    }

    if (teacher) {
      const teacherRecord = await db.teacher.findFirst({
        where: { id: teacher, schoolId },
        select: { id: true },
      });

      if (!teacherRecord) {
        return NextResponse.json(
          { message: "Teacher not found in your school" },
          { status: 400 }
        );
      }
    }

    if (student) {
      const studentRecord = await db.student.findFirst({
        where: { id: student, schoolId },
        select: { id: true },
      });

      if (!studentRecord) {
        return NextResponse.json(
          { message: "Student not found in your school" },
          { status: 400 }
        );
      }
    }

    await db.buses.create({
      data: {
        school: {
          connect: { id: schoolId },
        },
        bus_number,
        bus_product_name,
        seat_number,
        color,
        route: {
          connect: { id: routeRecord.id },
        },
        ...(teacher && {
          teacher: {
            connect: { id: teacher },
          },
        }),
        ...(student && {
          students: {
            connect: { id: student },
          },
        }),
      },
    });

    return NextResponse.json(
      { message: "Bus added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding Bus:", error);
    return NextResponse.json(
      {
        message: "Error adding Bus",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
