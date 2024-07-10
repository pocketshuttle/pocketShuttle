import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Driver from "@/(models)/Driver";
import { DriverSchema } from "@/schemas";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    const validatedData = DriverSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    const {
      full_name,
      email,
      phoneNumber,
      address,
      studentId,
      image,
      busId,
    } = validatedData.data;

    const newDriver = new Driver({
      full_name,
      email,
      phoneNumber,
      bus: busId,
      address,
      students: studentId,
      image,
    });

    await newDriver.save();

    return Response.json({ message: "Driver added Succesfully " });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { message: "Error adding Driver", error: error.message },
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
