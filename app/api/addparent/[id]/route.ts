import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
type ParamProp = {
  id: string;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    const { id } = params;

    const parent = await db.parent.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        Student: {
          select: {
            id: true,
            full_name: true,
            image: true,
            status: true,
            presence: true,
            bus: {
              select: {
                id: true,
                color: true,
                bus_product_name: true,
                bus_number: true,
                teacher: {
                  select: {
                    id: true,
                    full_name: true,
                    phoneNumber: true,
                  },
                },
                driver: {
                  select: {
                    id: true,
                    full_name: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return new Response(JSON.stringify({ message: "Parent not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(parent), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          message: "Error fetching Parent",
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
