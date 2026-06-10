import { NextRequest, NextResponse } from "next/server";
import z from "zod";

import db from "@/packages/db/client";
import { canManageSchool, getApiSession, isParent } from "@/lib/api-auth";

type ParamProp = {
  id: string;
};

const ParamsSchema = z.object({
  id: z.string().min(1),
});

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<ParamProp> }
) => {
  try {
    const parsedResult = ParamsSchema.safeParse(await params);

    if (!parsedResult.success) {
      return NextResponse.json(
        { message: "Invalid parent ID" },
        { status: 400 }
      );
    }

    const { id } = parsedResult.data;
    const session = await getApiSession();
    const schoolId = session?.schoolId;

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (isParent(session) && session.id !== id) {
      return NextResponse.json(
        { message: "Unauthorized. You can only access your own data." },
        { status: 403 }
      );
    }

    if (!isParent(session) && (!canManageSchool(session) || !schoolId)) {
      return NextResponse.json(
        { message: "Unauthorized. Insufficient permissions." },
        { status: 403 }
      );
    }

    const where = isParent(session) ? { id } : { id, schoolId: schoolId! };

    const parent = await db.parent.findFirst({
      where,
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
    return new Response(
      JSON.stringify({
        message: "Error fetching Parent",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
