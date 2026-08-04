import "server-only";

import { sendPushNotification } from "@/onesignal/send-push";
import db from "@/packages/db/client";

export async function notifyBillingOwner(input: {
  billingAccountId: string;
  eventType: string;
  message: string;
}) {
  const account = await db.billingAccount.findUnique({
    where: { id: input.billingAccountId },
    select: { parentId: true, userId: true },
  });
  const recipient = account?.parentId ?? account?.userId;
  if (!recipient) return null;

  const delivery = await db.notificationDelivery.create({
    data: {
      billingAccountId: input.billingAccountId,
      eventType: input.eventType,
      channel: "PUSH",
      recipient,
      message: input.message,
      attemptCount: 1,
    },
  });

  try {
    await sendPushNotification(input.message, recipient);
    return db.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
  } catch (error) {
    return db.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "Push delivery failed",
      },
    });
  }
}
