"use server";

import { db } from "@/lib/db";
import { BusSchema } from "@/schemas";
import { revalidateTag } from "next/cache";
import * as z from "zod";

export const addBus = async (values: z.infer<typeof BusSchema>) => {
  try {
    // Validate the input data using Zod schema
    const validatedData = BusSchema.safeParse(values);
    if (!validatedData.success) {
      return { message: validatedData.error.errors, status: 500 };
    }

    const {
      school_id,
      bus_number,
      driver,
      seat_number,
      teacher,
      student,
      color,
      bus_product_name,
      route,
    } = validatedData.data;

    // Create a new bus entry in the database
    await db.buses.create({
      data: {
        school: {
          connect: { id: school_id },
        },
        bus_number,
        bus_product_name,
        seat_number,
        color,
        route: {
          connect: { id: route },
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
