import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Driver from "@/(models)/Driver";
import { DriverSchema } from "@/schemas";
import Buses from "@/(models)/Bus";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();

    const data = await req.json();
    console.log("Received data:", data);

    const validatedData = DriverSchema.safeParse(data);
    if (!validatedData.success) {
      console.log("Validation error:", validatedData.error.errors);
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const {
      school_id,
      full_name,
      phoneNumber,
      image,
      address,
      email,
      studentId,
      busId,
    } = validatedData.data;

    // Creating a new Driver instance with validated data
    const newDriver = new Driver({
      school_id,
      full_name,
      phoneNumber,
      image,
      address,
      email,
      student: studentId ? [studentId] : [], 
      bus: busId, 
    });

    await newDriver.save(); 
    if (busId) {
      await Buses.findByIdAndUpdate(
        busId,
        { driver: newDriver._id },
        { new: true, useFindAndModify: false }
      );
    }
    return NextResponse.json(
      { message: "Driver added successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
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
