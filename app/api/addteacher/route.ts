import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Teacher from "@/(models)/Teachers";
import Buses from "@/(models)/Bus";
import { TeacherSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import NewUser from "@/(models)/NewUser";
import db from "@/packages/db/client";
import { revalidateTag } from "next/cache";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();
    const validatedData = TeacherSchema.safeParse(data);

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
      busId,
      password,
      role,
    } = validatedData.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = await db.teacher.create({
      data: {
        school: {
          connect: { id: school_id },
        },
        full_name,
        email,
        phoneNumber,
        ...(busId && {
          bus: {
            connect: { id: busId },
          },
        }),
        address,
        // students: studentId ? [studentId] : [],
        image,
        password: hashedPassword,
        role,
        // user: school_id,
      },
    });

    await db.newUser.create({
      data: {
        schoolId: school_id,
        email,
        password: hashedPassword,
        teacherId: newTeacher.id,
      },
    });

    if (busId) {
      await db.buses.update({
        where: { id: busId },
        data: {
          teacher: {
            connect: { id: newTeacher.id },
          },
        },
      });
    }

    revalidateTag("teacher");

    return Response.json(
      { message: "Teacher added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding Teacher:", error);
    return NextResponse.json(
      {
        message: "Error adding Teacher",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
