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
      //@ts-ignore
      where: query,
    });
    const driver = await db.driver.findMany({
      //@ts-ignore

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

    console.log(data);
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
