import { db } from "@/lib/db";
import webpush from "web-push";

export const sendNotification = async (
  message: string,
  userId: string,
  icon: string,
  name: string
) => {
  const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!,
  };

  // Setting VAPID keys
  webpush.setVapidDetails(
    "mailto:myuserid@email.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  try {
    // Fetch the subscription data from the database
    const subscription = await db.parentNotification.findFirst({
      where: { parentId: userId },
    });
    console.log(subscription, "PARENT");

    if (subscription) {
      // Send the notification
      await webpush.sendNotification(
        JSON.parse(subscription.notificationJson),
        JSON.stringify({
          message: name,
          icon,
          body: message,
        })
      );
      return "{}";
    } else {
      return JSON.stringify({ error: "No subscription found for this user" });
    }
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
