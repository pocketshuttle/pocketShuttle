"use server";

import Buses from "@/(models)/Bus";
import Teacher from "@/(models)/Teachers";
import { connectToDB } from "@/utils/connect-to-db";
import { NextResponse } from "next/server";

export const addRoute = async (id: string, routeId: string) => {
  try {
    await connectToDB();

    const updatedBus = await Buses.findByIdAndUpdate(
      id,
      {
        route: routeId,
      },
      { new: true, useFindAndModify: false }
    );

    return NextResponse.json(
      {
        message: "Route added successfully",
        teacher: updatedBus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating attendance:", error);

    return NextResponse.json(
      {
        message: "Error updating attendance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
