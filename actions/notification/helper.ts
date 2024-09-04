"use server";

import { db } from "@/lib/db";


export async function saveSubscriptionToDatabase(
  subscriptionData: any,
  userId: string
) {
  try {
    // Store the subscription in the database
    const notification = await db.notification.create({
      data: {
        notificationJson: JSON.stringify(subscriptionData),
      },
    });

    // Create the association in the join table
    await db.parentNotification.create({
      data: {
        parentId: userId,
        notificationId: notification.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error storing subscription in the database:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function removeNotification(userId: string) {
  try {
    // Delete notifications associated with the user
    await db.parentNotification.deleteMany({
      where: {
        parentId: userId,
      },
    });

    await db.notification.deleteMany({
      where: {
        parents: {
          some: {
            parentId: userId,
          },
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing subscription:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
