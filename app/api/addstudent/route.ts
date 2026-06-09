import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import db from "@/packages/db/client";
import { StudentSchema } from "@/schemas";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json(
        {
          message: "Unauthorized: Only admins or school staff can add students.",
        },
        { status: 403 }
      );
    }

    const data = await req.json();
    const validatedData = StudentSchema.safeParse(data);

    if (!validatedData.success) {
      return Response.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const {
      full_name,
      age,
      image,
      busId,
      parentId,
      teacherId,
      address,
      grade,
      gender,
    } = validatedData.data;

    if (busId) {
      const bus = await db.buses.findFirst({
        where: { id: busId, schoolId },
        select: { id: true },
      });

      if (!bus) {
        return NextResponse.json(
          { message: "Bus not found in your school" },
          { status: 400 }
        );
      }
    }

    if (teacherId) {
      const teacher = await db.teacher.findFirst({
        where: { id: teacherId, schoolId },
        select: { id: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { message: "Teacher not found in your school" },
          { status: 400 }
        );
      }
    }

    if (parentId) {
      const parent = await db.parent.findFirst({
        where: { id: parentId, schoolId, accountType: "SCHOOL_MANAGED" },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json(
          { message: "Parent not found in your school" },
          { status: 400 }
        );
      }
    }

    const newStudent = await db.student.create({
      data: {
        schoolId,
        full_name,
        age,
        image,
        grade,
        gender,
        busId: busId || undefined,
        teacherId: teacherId || undefined,
        parentId: parentId || undefined,
        address,
      },
    });

    if (busId) {
      await db.buses.update({
        where: { id: busId },
        data: {
          students: {
            connect: { id: newStudent.id },
          },
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_STUDENT",
        details: {
          createdBy: session.email ?? "",
          student: full_name,
          schoolId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    revalidateTag("students");

    return Response.json(
      { message: "Student added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding Student:", error);
    return NextResponse.json(
      {
        message: "Error adding Student",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
