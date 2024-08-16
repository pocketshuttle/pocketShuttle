import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Buses from "@/(models)/Bus";
import Student from "@/(models)/Student";
import { BusSchema } from "@/schemas";
import { db } from "@/lib/db";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    console.log(data);
    const validatedData = BusSchema.safeParse(data);

    console.log(validatedData);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const {
      school_id,
      bus_number,
      driver,
      seat_number,
      teacher,
      student,
      color,
      bus_product_name,
      route,
    } = validatedData.data;

    await db.buses.create({
      data: {
        school: {
          connect: { id: school_id },
        },
        // schoolId: school_id,
        bus_number,
        bus_product_name,
        seat_number,
        color,
        route: {
          connect: { id: route },
        },
        teacher: {
          connect: { id: teacher || undefined },
        },
        ...(student && {
          students: {
            connect: { id: student },
          },
        }),
        // teacherId: teacher || undefined,
        // studentId: student || undefined,
      },
    });

    return NextResponse.json(
      { message: "Bus added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding Bus:", error);
    return NextResponse.json(
      {
        message: "Error adding driver",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
