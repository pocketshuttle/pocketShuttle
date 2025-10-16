import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import { DriverSchema } from "@/schemas";
import db from "@/packages/db/client";
import { getUserSession } from "@/lib/session";

export const POST = async (req: NextRequest) => {
  try {
    const user = await getUserSession();
    if (!user || !["admin", "ADMIN"].includes(user.role as string)) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }
    const data = await req.json();

    const validatedData = DriverSchema.safeParse(data);
    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { school_id, full_name, phoneNumber, image, address, email, busId } =
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

    const newDriver = await db.driver.create({
      data: {
        school: {
          connect: { id: school_id },
        },
        full_name,
        phoneNumber,
        image,
        address,
        email,
        ...(busId && {
          bus: {
            connect: { id: busId },
          },
        }),
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
    // Handle errors
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
