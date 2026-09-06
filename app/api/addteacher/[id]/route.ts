import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import z from "zod";

import db from "@/packages/db/client";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

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
    const itemPerPage = 2;
    const url = new URL(req.url).searchParams;
    const searchName = url.get("q") || "";
    const page = parseInt(url.get("page") || "1", 10);

    type TeacherWhere = NonNullable<
      Parameters<typeof db.teacher.findMany>[0]
    >["where"];

    const whereClause: TeacherWhere = {
      ...(id === schoolId ? { schoolId } : { id, schoolId }),
      ...(searchName && {
        full_name: {
          contains: searchName,
          mode: "insensitive",
        },
      }),
    };

    const count = await db.teacher.count({
      where: whereClause,
    });

    const teacher = await db.teacher.findMany({
      where: whereClause,
      include: {
        Student: true,
        bus: {
          include: {
            students: true,
            driver: true,
          },
        },
      },
      take: itemPerPage,
      skip: itemPerPage * (page - 1),
    });

    if (!teacher || teacher.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: "Teacher not found!" }),
        {
          status: 404,
        }
      );
    }

    revalidateTag("new-teacher");

    return new Response(JSON.stringify({ teacher, count }), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({
        message: "Error fetching teacher",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
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
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const existingTeacher = await db.teacher.findFirst({
      where: { id, schoolId },
    });

    if (!existingTeacher) {
      return Response.json(
        { message: "Teacher not found!" },
        {
          status: 404,
        }
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

    const updateData: {
      schoolId: string;
      busId?: string | null;
      full_name?: string;
      address?: string;
      image?: string;
      email?: string;
      password?: string;
      role?: string;
    } = {
      schoolId,
      busId: data.busId || null,
      full_name: data.full_name,
      address: data.address,
      image: data.image,
      email: data.email,
      role: data.role,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await db.teacher.update({
      where: { id },
      data: updateData,
    });
    if (data.password) {
      await db.mobileSession.updateMany({
        where: {
          subjectRole: "TEACHER",
          subjectId: id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    return Response.json(
      { message: "Teacher Added Successfully" },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        message: "Error updating teacher",
        error: error instanceof Error ? error.message : "Unknown error",
      },
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
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingTeacher = await db.teacher.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existingTeacher) {
      return new Response(JSON.stringify({ message: "Teacher not found" }), {
        status: 404,
      });
    }

    await db.teacher.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ message: "Teacher deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Error deleting teacher",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
