import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Student from "@/(models)/Student";
import Buses from "@/(models)/Bus";

type ParamsProps = {
  id: string;
};
export const PATCH = async (
  req: NextRequest,
  { params }: { params: ParamsProps }
) => {
  try {
    await connectToDB();

    const { id } = params;

    const data = await req.json();
    if (!data) {
      return NextResponse.json(
        {
          message: "Student not found",
        },
        { status: 404 }
      );
    }
    const { studentId, busId } = data.attendance;

    if (!studentId || !busId) {
      return NextResponse.json(
        {
          message: "Both studentId and busId are required",
        },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId).populate("bus");

    if (student.bus && student.bus._id.toString() === busId) {
      return NextResponse.json(
        {
          message: "Student is already in this bus",
        },
        { status: 400 }
      );
    }
    // const student = await Buses.find({ student: studentId });
    await Buses.findByIdAndUpdate(
      busId,
      {
        $push: { student: studentId },
      },
      { new: true, useFindAndModify: false }
    );

    // Update student's bus assignment
    student.bus = busId;
    await student.save();

    return NextResponse.json(
      { message: "Student added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding student", error);

    return NextResponse.json(
      {
        message: "Error adding student",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: ParamsProps }
) => {
  try {
    await connectToDB();
    const data = await req.json();

    const { studentId, busId } = data.attendance;

    if (!studentId || !busId) {
      return NextResponse.json(
        {
          message: "Both studentId and busId are required",
        },
        { status: 400 }
      );
    }

    const bus = await Buses.findById(busId);
    const student = await Student.findById(studentId);

    if (!bus) {
      return NextResponse.json(
        {
          message: "Bus not found",
        },
        { status: 404 }
      );
    }

    if (!student) {
      return NextResponse.json(
        {
          message: "Student not found",
        },
        { status: 404 }
      );
    }

    console.log(bus.student);
    console.log(bus);
    console.log(student);
    // bus.student.filter((id: any) => id._id.toString() !== studentId);
    bus.student.pull(studentId);

    console.log(bus.students);
    await bus.save();

    // Remove the bus reference from the student document
    student.bus = null;
    await student.save();

    return NextResponse.json(
      { message: "Student removed from bus successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing student from bus:", error);

    return NextResponse.json(
      {
        message: "Error removing student from bus",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
