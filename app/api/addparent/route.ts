import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { ParentSchema } from "@/schemas";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json(
        {
          message: "Unauthorized: Only admins or school staff can add parents.",
        },
        { status: 403 }
      );
    }

    const data = await req.json();
    const validatedData = ParentSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validatedData.error.flatten().fieldErrors,
        },
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
      password,
      role,
    } = validatedData.data;

    const existingParent = await db.parent.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingParent) {
      return NextResponse.json(
        { message: "A parent with this email already exists." },
        { status: 409 }
      );
    }

    if (studentId) {
      const student = await db.student.findFirst({
        where: { id: studentId, schoolId },
        select: { id: true },
      });

      if (!student) {
        return NextResponse.json(
          { message: "Student not found in your school" },
          { status: 400 }
        );
      }
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newParent = await db.parent.create({
      data: {
        schoolId,
        full_name,
        email,
        phoneNumber,
        password: hashPassword,
        address,
        ...(studentId && {
          Student: {
            connect: { id: studentId },
          },
        }),
        image,
        role,
      },
    });

    await db.newUser.create({
      data: {
        schoolId,
        email,
        password: hashPassword,
        parentId: newParent.id,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_PARENT",
        details: {
          createdBy: session.email ?? "",
          parentEmail: email,
          schoolId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(
      { message: "Parent added Succesfully " },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
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
