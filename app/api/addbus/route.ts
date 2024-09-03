import { NextRequest, NextResponse } from "next/server";

import { BusSchema } from "@/schemas";
import { db } from "@/lib/db";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();
    const validatedData = BusSchema.safeParse(data);

    if (!validatedData.success) {
      console.log("Validation error:", validatedData.error.errors);
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
    console.log(route);

    await db.buses.create({
      data: {
        school: {
          connect: { id: school_id },
        },
        bus_number,
        bus_product_name,
        seat_number,
        color,
        route: {
          connect: { id: route },
        },
        ...(teacher && {
          teacher: {
            connect: { id: teacher },
          },
        }),
        ...(student && {
          students: {
            connect: { id: student },
          },
        }),
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
        message: "Error adding Bus",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
