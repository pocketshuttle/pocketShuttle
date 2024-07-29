import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Teacher from "@/(models)/Teachers";

type ParamProp = {
  id: string;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    await connectToDB();
    const ITEM_PER_PAGE = 2;

    const url = new URL(req.url).searchParams;
    const searchName = url.get("q") || "";
    const page: number = (url.get("page") as unknown as number) || 1;

    const { id } = params;
    const query = {
      $or: [{ school_id: id }, { _id: id }],
      ...(searchName && { full_name: new RegExp(searchName, "i") }),
    };

    const count = await Teacher.find(query).countDocuments();
    console.log(count);
    const teacher = await Teacher.find(query)
      .populate("students")
      .populate({
        path: "busId",
        model: "Buses",
        populate: [
          {
            path: "route",
            model: "Route",
          },
          {
            path: "student",
            model: "Student",
          },
        ],
      })
      .limit(ITEM_PER_PAGE)
      .skip(ITEM_PER_PAGE * (page - 1));

    if (!teacher) {
      return Response.json(
        { message: "Teacher not found!" },
        {
          status: 404,
        }
      );
    }

    return new Response(JSON.stringify({ teacher, count }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error fetching teacher",
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
