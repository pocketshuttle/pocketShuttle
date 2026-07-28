"use server";

import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";
import { BusSchema } from "@/schemas";
import { revalidateTag } from "next/cache";
import * as z from "zod";
import { assertWithinLimit, getEntitlements } from "@/lib/billing/entitlements";

export const addBus = async (values: z.infer<typeof BusSchema>) => {
  try {
    const user = await getUserSession();

    if (!user || !["admin", "school", "ADMIN"].includes(user.role as string)) {
      return {
        message: "Unauthorized: Only admins or school staff can add buses.",
        status: 403,
      };
    }

    // Validate the input data using Zod schema
    const validatedData = BusSchema.safeParse(values);
    if (!validatedData.success) {
      return { message: validatedData.error.errors, status: 500 };
    }

    const {
      bus_number,
      driver,
      seat_number,
      teacher,
      student,
      color,
      bus_product_name,
      route,
    } = validatedData.data;

    const schoolId = typeof user.schoolId === "string" ? user.schoolId : String(user.id);
    const [resolved, busCount] = await Promise.all([
      getEntitlements({ id: String(user.id), role: String(user.role), schoolId }),
      db.buses.count({ where: { schoolId } }),
    ]);
    assertWithinLimit(resolved, "max_buses", busCount);

    const [routeRecord, teacherRecord, studentRecord] = await Promise.all([
      db.route.findFirst({ where: { id: route, schoolId }, select: { id: true } }),
      teacher ? db.teacher.findFirst({ where: { id: teacher, schoolId }, select: { id: true } }) : null,
      student ? db.student.findFirst({ where: { id: student, schoolId }, select: { id: true } }) : null,
    ]);
    if (!routeRecord || (teacher && !teacherRecord) || (student && !studentRecord)) {
      return { message: "Invalid school bus assignment", status: 400 };
    }

    // Create a new bus entry in the database
    await db.buses.create({
      data: {
        school: {
          connect: { id: schoolId },
        },
        bus_number,
        bus_product_name,
        seat_number,
        availableSeats: seat_number,
        color,
        route: {
          connect: { id: routeRecord.id },
        },
        ...(teacher && {
          teacher: {
            connect: { id: teacher },
          },
        }),
        ...(student && {
          students: {
            connect: { id: student },
          },
        }),
      },
    });

    // Revalidate bus-related caches after adding a bus
    revalidateTag("bus");

    return { message: "Bus Added Successfully!", status: 200 };
  } catch (error: any) {
    console.error("Error adding Bus:", error.message || error);

    // Handle specific database errors or fallback to general error
    return { message: "Error adding Bus!", status: 400 };
  }
};
