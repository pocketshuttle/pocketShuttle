"use server";
// EDIT ROUTES_MANIFEST, SO PASS IN DETAILS TO CHECK
import Buses from "@/(models)/Bus";
import { getUserSession } from "@/lib/session";
import { connectToDB } from "@/utils/connect-to-db";

export const addRoute = async (busId: string, routeId: string) => {
  try {
    const user = await getUserSession();
    if (!user || !["admin", "school", "ADMIN"].includes(user.role as string)) {
      return {
        message: "Unauthorized: Only admins or school staff can add routes.",
        status: 403,
      };
    }

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
