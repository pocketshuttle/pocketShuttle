import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Teacher from "@/(models)/Teachers";
import bcrypt from "bcryptjs";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const {
      full_name,
      email,
      phoneNumber,
      address,
      student,
      image,
      password,
      // busId,
    } = await req.json();

    const hashPassword = await bcrypt.hash(password, 10);

    const newTeacher = new Teacher({
      full_name,
      email,
      phoneNumber,
      password: hashPassword,
      // busId,
      address,
      students: student,
      image,
    });

    await newTeacher.save();

    return Response.json({ message: "Parent added Succesfully " });
  } catch (error) {
    console.log(error);
  }
};
