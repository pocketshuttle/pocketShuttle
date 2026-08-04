import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { DriverSchema } from "@/schemas";
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
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const [resolved, teacherCount, driverCount] = await Promise.all([
      getEntitlements(session),
      db.teacher.count({ where: { schoolId } }),
      db.driver.count({ where: { schoolId } }),
    ]);
    assertWithinLimit(resolved, "max_staff", teacherCount + driverCount);

    const data = await req.json();

    const validatedData = DriverSchema.safeParse(data);
    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { full_name, phoneNumber, image, address, email, busId } =
      validatedData.data;

    const existingDriver = await db.driver.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingDriver) {
      return NextResponse.json(
        { message: "Driver already exists with this email or phone" },
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

    const newDriver = await db.driver.create({
      data: {
        schoolId,
        full_name,
        phoneNumber,
        image,
        address,
        email,
        busId: busId || undefined,
      },
    });

    if (busId) {
      await db.buses.update({
        where: { id: busId },
        data: {
          driver: {
            connect: { id: newDriver.id },
          },
        },
      });
    }

    return NextResponse.json(
      { message: "Driver added successfully" },
      { status: 200 }
    );
  } catch (error) {
    const entitlementResponse = upgradeRequiredResponse(error);
    if (entitlementResponse) return entitlementResponse;
    console.error("Error adding driver:", error);
    return NextResponse.json(
      {
        message: "Error adding driver",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
