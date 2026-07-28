import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import db from "@/packages/db/client";
import { TeacherSchema } from "@/schemas";
import { canManageSchool, getApiSession } from "@/lib/api-auth";
import {
  assertWithinLimit,
  getEntitlements,
} from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import { assertSameOrigin } from "@/lib/admin/request-security";

export const POST = async (req: NextRequest) => {
  try {
    assertSameOrigin(req);
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json(
        {
          message: "Unauthorized: Only admins or school staff can add teachers.",
        },
        { status: 403 }
      );
    }

    const [resolved, teacherCount, driverCount] = await Promise.all([
      getEntitlements(session),
      db.teacher.count({ where: { schoolId } }),
      db.driver.count({ where: { schoolId } }),
    ]);
    assertWithinLimit(resolved, "max_staff", teacherCount + driverCount);

    const data = await req.json();
    const validatedData = TeacherSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const {
      full_name,
      email,
      phoneNumber,
      address,
      image,
      busId,
      password,
      role,
    } = validatedData.data;

    const existingTeacher = await db.teacher.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingTeacher) {
      return NextResponse.json(
        { message: "A teacher with this email already exists." },
        { status: 409 }
      );
    }

    if (busId) {
      const bus = await db.buses.findFirst({
        where: { id: busId, schoolId },
        select: { id: true },
      });

      if (!bus) {
        return NextResponse.json(
          { message: "Bus not found in your school" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = await db.teacher.create({
      data: {
        schoolId,
        full_name,
        email,
        phoneNumber,
        busId: busId || undefined,
        address,
        image,
        password: hashedPassword,
        role,
      },
    });

    await db.newUser.create({
      data: {
        schoolId,
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

    await db.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_TEACHER",
        details: {
          createdBy: session.email ?? "",
          teacherEmail: email,
          schoolId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    revalidateTag("teacher");

    return Response.json(
      { message: "Teacher added Succesfully " },
      { status: 200 }
    );
  } catch (error) {
    const entitlementResponse = upgradeRequiredResponse(error);
    if (entitlementResponse) return entitlementResponse;
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
