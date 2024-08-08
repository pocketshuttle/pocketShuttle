import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";

type ParamProp = {
  id: string;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    await connectToDB();

    const ITEM_PER_PAGE = 4;
    const url = new URL(req.url).searchParams;

    const searchQuery = url.get("q") || "";
    const gradeQuery = url.get("grade") || "";
    const page: number = (url.get("page") as unknown as number) || 1;

    const { id } = params;
    const query = {
      $or: [{ school_id: id }, { _id: id }],
      //making the regex case insensitive
      ...(searchQuery && { full_name: new RegExp(searchQuery, "i") }),
      ...(gradeQuery && { grade: gradeQuery }),
    };

    if (gradeQuery && gradeQuery !== "All") {
      query.grade = gradeQuery;
    }
    //limit, shows the total number of users per page
    //skip, shows the next page- 1 then multiplied by the total number that was first displayed
    //then skip that total number
    const count = await Student.find(query).countDocuments();

    const students = await Student.find(query)
      .populate("bus")
      .limit(ITEM_PER_PAGE)
      .skip(ITEM_PER_PAGE * (page - 1));
    if (!students) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }

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
    await connectToDB();
    const { id } = params;
    const data = await req.json();
    console.log(data);

    const updatedStudent = await Student.findByIdAndUpdate(id, data, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the update adheres to the schema validation
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
    const deletedStudent = await Student.findByIdAndDelete(id);

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
