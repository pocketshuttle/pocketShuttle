import { NextRequest, NextResponse } from "next/server";
import { RouteSchema } from "@/schemas";
import db from "@/packages/db/client";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();
    console.log(data);
    const validatedData = RouteSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { school_id, route_description, route_name } = validatedData.data;

    await db.route.create({
      data: {
        schoolId: school_id,
        route_name,
        route_description,
      },
    });

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
