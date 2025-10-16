import { NextRequest, NextResponse } from "next/server";
import { RouteSchema } from "@/schemas";
import db from "@/packages/db/client";
import { getUserSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

export const POST = async (req: NextRequest) => {
  try {
    // 1. Authentication & authorization
    const user = await getUserSession();
    if (!user || !["admin", "ADMIN"].includes(user.role as string)) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    //  2. Validate request body
    const body = await req.json();
    const validated = RouteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validated.error.errors },
        { status: 400 }
      );
    }

    const { school_id, route_description, route_name } = validated.data;

    // 3. Prevent duplicate route names within the same school
    const existingRoute = await db.route.findFirst({
      where: {
        route_name: {
          equals: route_name,
          mode: "insensitive",
        },
        schoolId: school_id,
      },
    });

    if (existingRoute) {
      return NextResponse.json(
        { message: "A route with this name already exists for this school." },
        { status: 409 }
      );
    }

    // 4. Create route safely (in a transaction)
    const newRoute = await db.$transaction(async (tx) => {
      const created = await tx.route.create({
        data: {
          schoolId: school_id,
          route_name,
          route_description,
        },
      });

      return created;
    });

    //  5. Return clean success response
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

    // ✅ 6. Handle known Prisma errors for safer debugging
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Invalid school reference. Please check the school_id." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Error adding Route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
