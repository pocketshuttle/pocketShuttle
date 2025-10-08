import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";
import db from "@/packages/db/client";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
type ParamProp = {
  id: string;
};
export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const ITEM_PER_PAGE = 4;
    const url = new URL(req.url).searchParams;

    const searchQuery = url.get("q") || "";
    const gradeQuery = url.get("grade") || "";
    const page: number = (url.get("page") as unknown as number) || 1;

    const { id } = params;
    type StudentWhere = NonNullable<
      Parameters<typeof db.student.findMany>[0]
    >["where"];
    const query: StudentWhere = {
      OR: [
        {
          schoolId: id,
        },
        {
          id: id,
        },
      ],
      //making the regex case insensitive any
      ...(searchQuery && {
        full_name: { contains: searchQuery, mode: "insensitive" },
      }),
      ...(gradeQuery && gradeQuery !== "All" && { grade: gradeQuery }),
    };

    // if (gradeQuery && gradeQuery !== "All") {
    //   query.grade = gradeQuery;
    // }
    //limit, shows the total number of users per page
    //skip, shows the next page- 1 then multiplied by the total number that was first displayed
    //then skip that total number
    // const count = await Student.find(query).countDocuments();
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
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (page - 1),
    });

    if (!students) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }
    revalidateTag("collection");
    revalidateTag("students");

    return new Response(JSON.stringify({ students, count }), {
      status: 200,
    });
  } catch (error) {
    // Handle errors
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
  { params }: { params: ParamProp }
) => {
  try {
    const { id } = params;
    const data = await req.json();

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: {
        school: {
          connect: { id: data.school_id },
        },
        ...(data.busId && {
          bus: {
            connect: { id: data.busId },
          },
        }),
        ...(data.teacherId && {
          teacher: {
            connect: { id: data.busId },
          },
        }),
        full_name: data.full_name,
        address: data.address,
        image: data.image,
        grade: data.grade,
        gender: data.gender,
        age: data.age,
      },
    });

    if (!updatedStudent) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedStudent), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      return new Response(
        JSON.stringify({
          message: "Error updating Student",
          error: error.message,
        }),
        { status: 500 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "Unknown error occurred" }),
        { status: 500 }
      );
    }
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    await connectToDB();
    const { id } = params;
    const deletedStudent = await db.student.delete({
      where: { id: id },
    });

    if (!deletedStudent) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Student deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error deleting student",
          error: error.message,
        }),
        { status: 500 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "Unknown error occurred" }),
        { status: 500 }
      );
    }
  }
};
