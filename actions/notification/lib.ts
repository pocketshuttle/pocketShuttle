import { urlB64ToUint8Array } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { getUserSession } from "@/lib/session";
import { saveSubscriptionToDatabase } from "./helper";

export const generateSubscribeEndPoint = async (
  registration: ServiceWorkerRegistration
) => {
  const user = await getUserSession();
  if (!user || typeof user.id !== "string") {
    toast({
      description: "User session not found. Please log in.",
    });
    return;
  }

  const applicationServerKey = urlB64ToUint8Array(
    process.env.NEXT_PUBLIC_VAPID_KEY!
  );
  const options: PushSubscriptionOptionsInit = {
    applicationServerKey: applicationServerKey as unknown as BufferSource,
    userVisibleOnly: true,
  };

  try {
    const subscription = await registration.pushManager.subscribe(options);

    // Extract only the necessary serializable data
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        //@ts-ignore
        p256dh: subscription.toJSON().keys.p256dh,
        //@ts-ignore

        auth: subscription.toJSON().keys.auth,
      },
    };

    // Call server action or API route to save the subscription
    const result = await saveSubscriptionToDatabase(
      subscriptionData,
      user?.id!
    );

    if (result.error) {
      console.log(result.error);
      toast({
        description: "Error storing subscription: " + result.error,
      });
    }
  } catch (error) {
    console.log(error);
    toast({
      description:
        "Error during subscription creation: " +
        (error instanceof Error ? error.message : "Unknown error"),
    });
  }
};
