import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Buses from "@/(models)/Bus";
import Student from "@/(models)/Student";
import Route from "@/(models)/Route";
import { RouteSchema } from "@/schemas";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    const validatedData = RouteSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { school_id, route_description, route_name } = validatedData.data;

    const newRoute = new Route({
      school_id,
      route_description,
      route_name,
    });

    await newRoute.save();
    return Response.json(
      { message: "Route added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding Route:", error);
    return NextResponse.json(
      {
        message: "Error adding Route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
