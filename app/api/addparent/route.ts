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
    const {
      school_id,
      full_name,
      email,
      phoneNumber,
      address,
      studentId,
      image,
      password,
    } = validatedData.data;

    const hashPassword = await bcrypt.hash(password, 10);

    const newParent = new Parent({
      school_id,
      full_name,
      email,
      phoneNumber,
      password: hashPassword,
      address,
      students: studentId,
      image,
    });

    await newParent.save();

    return Response.json(
      { message: "Parent added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { message: "Error adding parent", error: error.message },
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
