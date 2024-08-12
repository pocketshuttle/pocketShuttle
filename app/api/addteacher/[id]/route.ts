import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Teacher from "@/(models)/Teachers";
import { db } from "@/lib/db";

type ParamProp = {
  id: string;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const ITEM_PER_PAGE = 2;

    const url = new URL(req.url).searchParams;
    const searchName = url.get("q") || "";
    const page: number = parseInt(url.get("page") || "1", 10);
    const { id } = params;

    const whereClause = {
      OR: [
        {
          schoolId: id,
        },
        {
          id: id,
        },
      ],

      ...(searchName && {
        full_name: {
          contains: searchName,
          mode: "insensitive",
        },
      }),
    };

    // const count = await db.teacher.count({
    //   where: whereClause,
    // });

    const count = await db.teacher.count({
      where: whereClause,
    });

    const teacher = await db.teacher.findMany({
      where: whereClause,
      include: {
        Student: true,
        // busId: {
        //   include: {
        //     route: true,
        //     students: true,
        //   },
        // },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (page - 1),
    });

    console.log(teacher);

    if (!teacher) {
      return new NextResponse(
        JSON.stringify({ message: "Teacher not found!" }),
        {
          status: 404,
        }
      );
    }

    return new NextResponse(JSON.stringify({ teacher, count }), {
      status: 200,
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
  { params }: { params: ParamProp }
) => {
  try {
    await connectToDB();
    const { id } = params;
    const data = await req.json();

    const updatedTeacher = await Teacher.findByIdAndUpdate(id, data, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the update adheres to the schema validation
    });

    if (!updatedTeacher) {
      return Response.json(
        { message: "Teacher not found!" },
        {
          status: 404,
        }
      );
    }
    return Response.json(
      { message: "Teacher Added Successfully" },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        {
          message: "Error updating Student",
          error: error.message,
        },
        { status: 500 }
      );
    } else {
      return Response.json(
        { message: "Unknown error occurred" },
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
    const deletedTeacher = await Teacher.findByIdAndDelete(id);

    if (!deletedTeacher) {
      return new Response(JSON.stringify({ message: "Teacher not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Teacher deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error deleting teacher",
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
