"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";

const SchoolSettingsSchema = z.object({
  pickupWindow: z.coerce
    .number()
    .int()
    .min(5, "Pickup window must be at least 5 minutes")
    .max(120, "Pickup window cannot be more than 120 minutes"),
  notifyDistance: z.coerce
    .number()
    .int()
    .min(50, "Notification distance must be at least 50 meters")
    .max(5000, "Notification distance cannot be more than 5,000 meters"),
});

export async function updateSchoolSettings(values: unknown) {
  const session = await getUserSession();
  const role = String(session?.role ?? "").toLowerCase();
  const schoolId = String(session?.schoolId ?? session?.id ?? "");

  if (!schoolId || !["admin", "school"].includes(role)) {
    return {
      status: 403,
      message: "Only school admins can update settings.",
    };
  }

  const validatedFields = SchoolSettingsSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      status: 400,
      message:
        validatedFields.error.errors[0]?.message ||
        "Please check the commute settings.",
    };
  }

  try {
    const settings = await db.$transaction(async (tx) => {
      const updatedSettings = await tx.schoolSettings.upsert({
        where: { schoolId },
        create: {
          schoolId,
          pickupWindow: validatedFields.data.pickupWindow,
          notifyDistance: validatedFields.data.notifyDistance,
        },
        update: {
          pickupWindow: validatedFields.data.pickupWindow,
          notifyDistance: validatedFields.data.notifyDistance,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: schoolId,
          action: "MODIFY_SETTINGS",
          details: {
            pickupWindow: validatedFields.data.pickupWindow,
            notifyDistance: validatedFields.data.notifyDistance,
          },
        },
      });

      return updatedSettings;
    });

    revalidatePath("/dashboard/settings");

    return {
      status: 200,
      message: "Commute settings saved.",
      settings: {
        pickupWindow: settings.pickupWindow,
        notifyDistance: settings.notifyDistance,
      },
    };
  } catch (error) {
    console.error("Error updating school settings:", error);

    return {
      status: 500,
      message: "Unable to save settings. Please try again.",
    };
  }
}
