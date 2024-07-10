import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Buses from "@/(models)/Bus";
import { BusSchema } from "@/schemas";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    const validatedData = BusSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    const { bus_number, driver, seat_number, teacher, student } =
      validatedData.data;

    const newBus = new Buses({
      busNumber: bus_number,
      driver,
      seatNumber: seat_number,
      teacher,
      student,
    });

    await newBus.save();

    return Response.json({ message: "Bus added Succesfully " });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { message: "Error adding Bus", error: error.message },
        { status: 400 }
      );
    } else {
      return Response.json(
        { message: "Unknown error occurred" },
        { status: 400 }
      );
    }
  }
};
