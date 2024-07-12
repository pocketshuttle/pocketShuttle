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
  console.log("params", params);
  try {
    await connectToDB();

    const { id } = params;
    const teacher = await Teacher.find({
      $or: [{ creator: id }, { _id: id }],
    });

    if (!teacher) {
      return new Response(JSON.stringify({ message: "Teacher not found!" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(teacher), {
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
      return new Response(JSON.stringify({ message: "Teacher not found" }), {
        status: 404,
      });
    }
    return new Response(JSON.stringify(updatedTeacher), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof Error) {
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
