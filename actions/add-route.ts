"use server";
// EDIT ROUTES_MANIFEST, SO PASS IN DETAILS TO CHECK
import db from "@/packages/db/client";
import { getUserSession } from "@/lib/session";

export const addRoute = async (busId: string, routeId: string) => {
  try {
    const user = await getUserSession();
    if (!user || !["admin", "school", "ADMIN"].includes(user.role as string)) {
      return {
        message: "Unauthorized: Only admins or school staff can add routes.",
        status: 403,
      };
    }

    await db.buses.update({
      where: { id: busId },
      data: { routeId },
    });

    return { message: "Route added successfully" };
  } catch (error) {
    console.error("Error updating attendance:", error);

    return { message: "Error updating route" };
  }
};
