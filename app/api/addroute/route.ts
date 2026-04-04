import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { RouteSchema } from "@/schemas";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = RouteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validated.error.errors },
        { status: 400 }
      );
    }

    const { route_description, route_name } = validated.data;

    const existingRoute = await db.route.findFirst({
      where: {
        route_name: {
          equals: route_name,
          mode: "insensitive",
        },
        schoolId,
      },
    });

    if (existingRoute) {
      return NextResponse.json(
        { message: "A route with this name already exists for this school." },
        { status: 409 }
      );
    }

    const newRoute = await db.$transaction(async (tx) => {
      return tx.route.create({
        data: {
          schoolId,
          route_name,
          route_description,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Route added successfully",
        routeId: newRoute.id,
        status: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(" Error adding Route:", error);

    return NextResponse.json(
      {
        message: "Error adding Route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
