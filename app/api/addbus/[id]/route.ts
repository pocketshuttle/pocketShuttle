import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { BusSchema } from "@/schemas";
import { revalidateTag } from "next/cache";
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const where = id === schoolId ? { schoolId } : { id, schoolId };

    const bus = await db.buses.findMany({
      where,
      include: {
        route: true,
        teacher: true,
        students: true,
        driver: true,
      },
    });

    revalidateTag("bus");

    if (!bus || bus.length === 0) {
      return new Response(JSON.stringify({ message: "Bus not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(bus), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error fetching Bus",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const data = await req.json();
    const validatedData = BusSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const existingBus = await db.buses.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existingBus) {
      return NextResponse.json({ message: "Bus not found" }, { status: 404 });
    }

    const routeId = validatedData.data.route;
    if (routeId) {
      const routeRecord = await db.route.findFirst({
        where: { id: routeId, schoolId },
        select: { id: true },
      });

      if (!routeRecord) {
        return NextResponse.json(
          { message: "Route not found in your school" },
          { status: 400 }
        );
      }
    }

    const updatedBus = await db.buses.update({
      where: {
        id,
      },
      data: {
        schoolId,
        bus_product_name: data.bus_product_name,
        bus_number: data.bus_number,
        color: data.color,
        seat_number: data.seat_number,
        routeId: routeId || undefined,
      },
    });

    return new Response(JSON.stringify(updatedBus), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error updating Bus",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const existingBus = await db.buses.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existingBus) {
      return NextResponse.json({ message: "Bus not found" }, { status: 404 });
    }

    await db.buses.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ message: "Bus deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error deleting Bus",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
