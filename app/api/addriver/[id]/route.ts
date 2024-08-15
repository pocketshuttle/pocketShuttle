import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Driver from "@/(models)/Driver";
import { db } from "@/lib/db";

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

    const url = new URL(req.url).searchParams;
    const searchDriver = url.get("q") || "";
    const query = {
      OR: [{ schoolId: id }, { id: id }],
      ...(searchDriver && {
        full_name: { contains: searchDriver, mode: "insensitive" },
      }),
    };
    const driversCount = await db.driver.count({
      where: query,
    });
    const driver = await db.driver.findMany({
      where: query,
      include: {
        bus: true,
      },
    });

    if (!driver) {
      return new Response(JSON.stringify({ message: "Driver not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ driver, driversCount }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error fetching Driver",
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
    console.log(data);
    const updatedDriver = await Driver.findByIdAndUpdate(id, data, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the update adheres to the schema validation
    });

    if (!updatedDriver) {
      return new Response(JSON.stringify({ message: "Driver not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedDriver), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error updating Driver",
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
    const deletedDriver = await Driver.findByIdAndDelete(id);

    if (!deletedDriver) {
      return new Response(JSON.stringify({ message: "Driver not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Driver deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error deleting Driver",
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
