import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";
import { NextRequest, NextResponse } from "next/server";
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
        { message: "Invalid parent ID" },
        { status: 400 }
      );
    }
    const { id } = parsedResult.data;

    const user = await getUserSession();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const allowedRoles = ["parent", "admin"];
    if (!allowedRoles.includes(user.role as string)) {
      return NextResponse.json(
        { message: "Unauthorized. Insufficient permissions." },
        { status: 403 }
      );
    }

    if (user.role === "parent" && user.id !== id) {
      return NextResponse.json(
        { message: "Unauthorized. You can only access your own data." },
        { status: 403 }
      );
    }

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
                    image: true,
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

    return NextResponse.json(parent, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
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
