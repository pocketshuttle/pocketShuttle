import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";
import { StudentSchema } from "@/schemas";
import Buses from "@/(models)/Bus";
import { db } from "@/lib/db";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const data = await req.json();
    const validatedData = StudentSchema.safeParse(data);

    if (!validatedData.success) {
      return Response.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    const {
      school_id,
      full_name,
      age,
      image,
      busId,
      parentId,
      teacherId,
      driverId,
      address,
      grade,
      gender,
    } = validatedData.data;

    const newStudent = await db.student.create({
      data: {
        schoolId: school_id,
        full_name,
        age,
        image,
        grade,
        gender,
        busId: busId || undefined,
        teacherId: teacherId || undefined,
        // driverId: driverId || undefined,
        // parentId: parentId || undefined,
        address,
      },
    });

    // await newStudent.save();
    if (busId) {
      await db.buses.update({
        where: { id: busId },
        data: {
          students: {
            connect: { id: newStudent.id },
          },
        },
      });


      if (newStudent) {
        return Response.json(
          { message: "Student added Succesfully " },
          { status: 200 }
        );
      }
    }
  } catch (error) {
    // Handle errors
    console.error("Error adding Student:", error);
    return NextResponse.json(
      {
        message: "Error adding Student",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
