import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import Driver from "@/(models)/Driver";

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

    const newDriver = new Driver({
      full_name,
      email,
      phoneNumber,
      password: hashPassword,
      // busId,
      address,
      students: student,
      image,
    });

    await newDriver.save();

    return Response.json({ message: "Driver added Succesfully " });
  } catch (error) {
    return Response.json({ message: "Error " }, { status: 400 });
  }
};
