"use server";

import Buses from "@/(models)/Bus";
import { connectToDB } from "@/utils/connect-to-db";

export const addRoute = async (busId: string, routeId: string) => {
  try {
    await connectToDB();

    await Buses.findByIdAndUpdate(
      busId,
      {
        route: routeId,
      },
      { new: true, useFindAndModify: false }
    );

    return { message: "Route added successfully" };
  } catch (error) {
    console.error("Error updating attendance:", error);

    return { message: "Error updating route" };
  }
};
