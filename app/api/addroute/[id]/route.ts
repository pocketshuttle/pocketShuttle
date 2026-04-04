import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { RouteSchema } from "@/schemas";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

type ParamProp = {
  id: string;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const routes = await db.route.findMany({
      where: id === schoolId ? { schoolId } : { id, schoolId },
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

export const PATCH = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
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

    const existingRoute = await db.route.findFirst({ where: { id, schoolId } });
    if (!existingRoute) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    const updatedRoute = await db.route.update({
      where: { id },
      data: {
        schoolId,
        route_name: validated.data.route_name,
        route_description: validated.data.route_description,
      },
    });

    return NextResponse.json(
      { message: "Route updated successfully", route: updatedRoute },
      { status: 200 }
    );
  } catch (error) {
    console.error(" Error updating route:", error);

    return NextResponse.json(
      {
        message: "Error updating route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existingRoute = await db.route.findFirst({ where: { id, schoolId } });

    if (!existingRoute) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    const deleted = await db.route.delete({ where: { id } });

    return NextResponse.json(
      { message: "Route deleted successfully", deletedRouteId: deleted.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting route:", error);

    return NextResponse.json(
      {
        message: "Error deleting Route",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
