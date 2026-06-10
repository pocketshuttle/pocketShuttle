import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import z from "zod";

import db from "@/packages/db/client";
import { canManageSchool, canManageStudentRecords, getApiSession } from "@/lib/api-auth";

type ParamProp = {
  id: string;
};

const ParamsSchema = z.object({
  id: z.string().cuid(),
});

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<ParamProp> }
) => {
  try {
    const parsedResult = ParamsSchema.safeParse(await params);

    if (!parsedResult.success) {
      return NextResponse.json(
        { message: "Invalid parent ID" },
        { status: 400 }
      );
    }

    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = parsedResult.data;
    const itemPerPage = 4;
    const url = new URL(req.url).searchParams;
    const searchQuery = url.get("q") || "";
    const gradeQuery = url.get("grade") || "";
    const page = Number(url.get("page") || "1");

    type StudentWhere = NonNullable<
      Parameters<typeof db.student.findMany>[0]
    >["where"];

    const query: StudentWhere = {
      ...(id === schoolId ? { schoolId } : { id, schoolId }),
      ...(searchQuery && {
        full_name: { contains: searchQuery, mode: "insensitive" },
      }),
      ...(gradeQuery && gradeQuery !== "All" && { grade: gradeQuery }),
    };

    const count = await db.student.count({
      where: query,
    });

    const students = await db.student.findMany({
      where: query,
      include: {
        bus: true,
        parent: {
          include: {
            Student: true,
          },
        },
      },
      take: itemPerPage,
      skip: itemPerPage * (page - 1),
    });

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }

    revalidateTag("collection");
    revalidateTag("students");

    return new Response(JSON.stringify({ students, count }), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching Student:", error);
    return NextResponse.json(
      {
        message: "Error fetching Student",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<ParamProp> }
) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageStudentRecords(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const existingStudent = await db.student.findFirst({
      where: { id, schoolId },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    if (data.busId) {
      const bus = await db.buses.findFirst({
        where: { id: data.busId, schoolId },
        select: { id: true },
      });

      if (!bus) {
        return NextResponse.json(
          { message: "Bus not found in your school" },
          { status: 400 }
        );
      }
    }

    if (data.teacherId) {
      const teacher = await db.teacher.findFirst({
        where: { id: data.teacherId, schoolId },
        select: { id: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { message: "Teacher not found in your school" },
          { status: 400 }
        );
      }
    }

    if (data.parentId) {
      const parent = await db.parent.findFirst({
        where: { id: data.parentId, schoolId, accountType: "SCHOOL_MANAGED" },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json(
          { message: "Parent not found in your school" },
          { status: 400 }
        );
      }
    }

    const updatedStudent = await db.student.update({
      where: { id },
      data: {
        schoolId,
        busId: data.busId || null,
        teacherId: data.teacherId || null,
        parentId: data.parentId || null,
        full_name: data.full_name,
        address: data.address,
        image: data.image,
        grade: data.grade,
        gender: data.gender,
        age: data.age,
      },
    });

    return new Response(JSON.stringify(updatedStudent), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error updating Student",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<ParamProp> }
) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageStudentRecords(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingStudent = await db.student.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existingStudent) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }

    await db.student.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ message: "Student deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error deleting student",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
