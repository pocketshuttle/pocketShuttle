import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Buses from "@/(models)/Bus";
import { BusSchema } from "@/schemas";

type ParamProp = {
  id: string;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    await connectToDB();
    const { id } = params;
    const bus = await Buses.find({
      $or: [{ school_id: id }, { _id: id }],
    })
      .populate("driver")
      .populate("teacher")
      .populate("student")
      .populate("route");

    if (!bus) {
      return new Response(JSON.stringify({ message: "Bus not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(bus), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error fetching Bus",
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
    const validatedData = BusSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    console.log(data);

    const updatedBus = await Buses.findByIdAndUpdate(id, data, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the update adheres to the schema validation
    });

    if (!updatedBus) {
      return new Response(JSON.stringify({ message: "Bus not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedBus), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error updating Bus",
          error: error.message,
        }),
        { status: 500 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "Unknown error occurred" }),
        { status: 404 }
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
    const deletedBus = await Buses.findByIdAndDelete(id);

    if (!deletedBus) {
      return new Response(JSON.stringify({ message: "Bus not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Bus deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error deleting Bus",
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
