import { toast } from "@/components/ui/use-toast";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { urlB64ToUint8Array } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export const generateSubscribeEndPoint = async (
  newRegistration: ServiceWorkerRegistration
) => {
  const queryClient = useQueryClient();
  const user = await getUserSession();

  const applicationServerKey = urlB64ToUint8Array(
    process.env.NEXT_PUBLIC_VAPID_KEY!
  );
  const options = {
    applicationServerKey,
    userVisibleOnly: true,
  };
  const subscription = await newRegistration.pushManager.subscribe(options);

  try {
    // Store the subscription in the database
    const notification = await db.notification.create({
      data: {
        notificationJson: JSON.stringify(subscription),
      },
    });

    // Create the association in the join table
    await db.parentNotification.create({
      data: {
        parentId: user?.id!,
        notificationId: notification.id,
      },
    });

    queryClient.invalidateQueries({ queryKey: ["user"] });
  } catch (error) {
    console.log(error);
    toast({
      description:
        "Error storing subscription: " +
        (error instanceof Error ? error.message : "Unknown error"),
    });
  }
};


export const removeNotification = async (parentId: string) => {
  try {
    // Remove parent notifications
    await db.parentNotification.deleteMany({
      where: {
        parentId,
      },
    });

    // Remove associated notifications
    await db.notification.deleteMany({
      where: {
        parents: {
          some: {
            parentId,
          },
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing subscription:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};
