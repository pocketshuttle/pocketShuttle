import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Buses from "@/(models)/Bus";
import { BusSchema } from "@/schemas";

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
    } = validatedData.data;

    const newBus = new Buses({
      school_id,
      bus_number,
      driver: driver || null,
      seat_number,
      teacher: teacher || null,
      student: student || [],
      color,
      bus_product_name,
    });

    await newBus.save();

    return NextResponse.json(
      { message: "Bus added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding driver:", error);
    return NextResponse.json(
      {
        message: "Error adding driver",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
