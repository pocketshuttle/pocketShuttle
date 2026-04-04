import { NextRequest, NextResponse } from "next/server";
import z from "zod";

import db from "@/packages/db/client";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

type ParamProp = {
  id: string;
};

const ParamsSchema = z.object({
  id: z.string().cuid(),
});

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const parsedResult = ParamsSchema.safeParse(params);
    if (!parsedResult.success) {
      return NextResponse.json(
        { message: "Invalid school ID" },
        { status: 400 }
      );
    }

    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return new Response(
        JSON.stringify({ message: "Unauthorized. Please log in." }),
        { status: 401 }
      );
    }

    const { id } = parsedResult.data;
    const searchDriver = new URL(req.url).searchParams.get("q") || "";

    type DriverWhere = NonNullable<
      Parameters<typeof db.driver.findMany>[0]
    >["where"];

    const query: DriverWhere = {
      ...(id === schoolId ? { schoolId } : { id, schoolId }),
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

    if (!driver || driver.length === 0) {
      return new Response(JSON.stringify({ message: "Driver not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ driver, driversCount }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error fetching Driver",
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const data = await req.json();

    const existingDriver = await db.driver.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existingDriver) {
      return new Response(JSON.stringify({ message: "Driver not found" }), {
        status: 404,
      });
    }

    if (data.busId) {
      const bus = await db.buses.findFirst({
        where: { id: data.busId, schoolId },
        select: { id: true },
      });

      if (!bus) {
        return NextResponse.json(
          { message: "Bus not found in your school" },
          { status: 400 }
        );
      }
    }

    await db.driver.update({
      where: { id },
      data: {
        schoolId,
        busId: data.busId || null,
        full_name: data.full_name,
        address: data.address,
        image: data.image,
        email: data.email,
      },
    });

    return Response.json(
      { message: "Driver updated Successfully" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error updating Driver",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
