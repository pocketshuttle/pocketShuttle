import { NextRequest, NextResponse } from "next/server";
import Driver from "@/(models)/Driver";
import db from "@/packages/db/client";
import { getUserSession } from "@/lib/session";
import z from "zod";

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
    const { id } = parsedResult.data;

    const user = await getUserSession();

    console.log(user, "from admin");

    if (!user || !["admin", "Admin", "ADMIN"].includes(user.role as string)) {
      return new Response(
        JSON.stringify({ message: "Unauthorized. Please log in." }),
        { status: 401 }
      );
    }


    const url = new URL(req.url).searchParams;
    const searchDriver = url.get("q") || "";
    type DriverWhere = NonNullable<
      Parameters<typeof db.driver.findMany>[0]
    >["where"];
    const query: DriverWhere = {
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
    const { id } = params;
    const data = await req.json();

    const updatedDriver = await db.driver.update({
      where: { id: id },
      data: {
        school: {
          connect: { id: data.school_id },
        },
        busId: data.busId || undefined,
        full_name: data.full_name,
        address: data.address,
        image: data.image,
        email: data.email,
      },
    });

    if (!updatedDriver) {
      return new Response(JSON.stringify({ message: "Driver not found" }), {
        status: 404,
      });
    }

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
