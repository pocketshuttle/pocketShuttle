import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Buses from "@/(models)/Bus";
import { BusSchema } from "@/schemas";
import db from "@/packages/db/client";
import { revalidateTag } from "next/cache";

type ParamProp = {
  id: string;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const { id } = params;
    const bus = await db.buses.findMany({
      where: {
        OR: [{ id: id }, { schoolId: id }],
      },
      include: {
        route: true,
        teacher: true,
        students: true,
        driver: true,
      },
    });
    revalidateTag("bus");
    if (!bus) {
      return new Response(JSON.stringify({ message: "Bus not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(bus), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error fetching Bus",
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
    await connectToDB();
    const { id } = params;
    const data = await req.json();
    const validatedData = BusSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    console.log(data);

    const updatedBus = await db.buses.update({
      where: {
        id: id,
      },
      data: {
        schoolId: data.school_id,
        bus_product_name: data.bus_product_name,
        bus_number: data.bus_number,
        color: data.color,
        seat_number: data.seat_number,
      },
    });

    if (!updatedBus) {
      return new Response(JSON.stringify({ message: "Bus not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedBus), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error updating Bus",
          error: error.message,
        }),
        { status: 500 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "Unknown error occurred" }),
        { status: 404 }
      );
    }
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    await connectToDB();
    const { id } = params;
    const deletedBus = await db.buses.delete({
      where: { id: id },
    });

    if (!deletedBus) {
      return new Response(JSON.stringify({ message: "Bus not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Bus deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error deleting Bus",
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
