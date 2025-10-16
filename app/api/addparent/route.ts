import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Parent from "@/(models)/Parent";
import bcrypt from "bcryptjs";
import { ParentSchema } from "@/schemas";
import db from "@/packages/db/client";
import { getUserSession } from "@/lib/session";

export const POST = async (req: NextRequest) => {
  try {
    //  1. Verify user session & role
    const user = await getUserSession();

    if (!user || !["admin", "school", "Admin"].includes(user.role as string)) {
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
      role,
    } = validatedData.data;

    // ✅ 3. Prevent duplicate parent
    const existingParent = await db.parent.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingParent) {
      return NextResponse.json(
        { message: "A parent with this email already exists." },
        { status: 409 }
      );
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newParent = await db.parent.create({
      data: {
        school: {
          connect: { id: school_id },
        },
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
        school: {
          connect: { id: school_id },
        },
        email,
        password: hashPassword,
        parent: {
          connect: { id: newParent.id },
        },
      },
    });

    await db.auditLog.create({
      data: {
        userId: String(user.id ?? ""),
        action: "CREATE_PARENT",
        details: {
          createdBy: String(user.email ?? ""),
          parentEmail: email,
          schoolId: school_id,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return Response.json(
      { message: "Parent added Succesfully " },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
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
