import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Parent from "@/(models)/Parent";
import Student from "@/(models)/Student";
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
    const whereClause = {
      OR: [
        {
          schoolId: id,
        },
        {
          id: id,
        },
      ],

      // ...(searchName && {
      //   full_name: {
      //     contains: searchName,
      //     mode: "insensitive",
      //   },
      // }),
    };

    const parentCount = await db.parent.count({
      //@ts-ignore
      where: whereClause,
    });

    const parent = await db.parent.findMany({
      where: whereClause,
      include: {
        Student: {
          include: {
            bus: {
              include: {
                teacher: true,
                driver: true,
              },
            },
          },
        },
      },
    });
    // const parent = await Parent.find(query).populate({
    //   path: "students",
    //   model: "Student",
    // });

    console.log("Fetched parent data: ", parent);

    if (parent.length === 0) {
      return new Response(JSON.stringify({ message: "Parent not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ parent, parentCount }), {
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
