import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Parent from "@/(models)/Parent";
import bcrypt from "bcryptjs";
import { ParentSchema } from "@/schemas";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    const validatedData = ParentSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    console.log(validatedData.data);
    const {
      school_id,
      full_name,
      email,
      phoneNumber,
      address,
      studentId,
      image,
      password,
      role,
    } = validatedData.data;

    const hashPassword = await bcrypt.hash(password, 10);

    const newParent = new Parent({
      school_id,
      full_name,
      email,
      phoneNumber,
      password: hashPassword,
      address,
      students: studentId ? [studentId] : [],
      image,
      role,
    });

    await newParent.save();

    return Response.json(
      { message: "Parent added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error("Error adding Parent:", error);
    return NextResponse.json(
      {
        message: "Error adding Parent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
