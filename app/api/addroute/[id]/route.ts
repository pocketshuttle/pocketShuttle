import { NextRequest, NextResponse } from "next/server";
import { RouteSchema } from "@/schemas";
import db from "@/packages/db/client";
import { getUserSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

type ParamProp = {
  id: string;
};

/**
 * GET Route(s)
 * Fetch a route by ID or all routes for a school
 */
export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const routes = await db.route.findMany({
      where: {
        OR: [{ id }, { schoolId: id }],
      },
    });

    if (!routes || routes.length === 0) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    return NextResponse.json(routes, { status: 200 });
  } catch (error) {
    console.error("Error fetching route:", error);

    return NextResponse.json(
      {
        message: "Error fetching Route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

/**
 * PATCH Route
 * Update an existing route
 */
export const PATCH = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const user = await getUserSession();
    if (!user || !["admin", "ADMIN"].includes(user.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const validated = RouteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validated.error.errors },
        { status: 400 }
      );
    }

    const existingRoute = await db.route.findUnique({ where: { id } });
    if (!existingRoute) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    const updatedRoute = await db.route.update({
      where: { id },
      data: validated.data,
    });

    return NextResponse.json(
      { message: "Route updated successfully", route: updatedRoute },
      { status: 200 }
    );
  } catch (error) {
    console.error(" Error updating route:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Error updating route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

/**
 * DELETE Route
 * Remove a route safely
 */
export const DELETE = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const user = await getUserSession();
    if (!user || !["admin", "ADMIN"].includes(user.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Soft delete alternative: if you don’t want to fully remove records, use a `deleted` flag.
    const deleted = await db.route.delete({ where: { id } });

    return NextResponse.json(
      { message: "Route deleted successfully", deletedRouteId: deleted.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting route:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Error deleting Route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
