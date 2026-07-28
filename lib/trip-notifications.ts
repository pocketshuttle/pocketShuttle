import "server-only";

import { Knock } from "@knocklabs/node";

import { sendPushNotification } from "@/onesignal/send-push";
import db from "@/packages/db/client";
import { TripEventType } from "@prisma/client";
import { getTripOwnerEntitlements } from "@/lib/billing/trip-entitlements";
import {
  assertPremiumMessageAvailable,
  consumePremiumMessage,
} from "@/lib/billing/premium-messages";
import { sendPremiumChannel } from "@/lib/billing/premium-delivery";

type TripEventNotificationInput = {
  tripId: string;
  eventType: TripEventType;
  payload?: Record<string, unknown> | null;
};

function getString(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getTripEventMessage(eventType: TripEventType, payload?: Record<string, unknown> | null) {
  const studentName = getString(payload, "studentName") ?? "Passenger";
  const busName = getString(payload, "busName") ?? "Vehicle";
  const eta = getString(payload, "eta") ?? "soon";

  switch (eventType) {
    case "trip_started":
      return `${busName} is on the way. ETA: ${eta}.`;
    case "participant_boarded":
      return `${studentName} has boarded ${busName}.`;
    case "participant_dropped":
      return `${studentName} has been dropped off.`;
    case "stop_reached":
      return `${busName} reached a scheduled stop.`;
    case "route_deviation":
      return `${busName} may have deviated from the route.`;
    case "unusual_stop":
      return `${busName} has stopped unexpectedly.`;
    case "emergency_triggered":
      return `Emergency alert triggered for ${busName}.`;
    case "emergency_resolved":
      return `Emergency alert resolved for ${busName}.`;
    case "trip_ended":
      return `${busName} has arrived safely.`;
    case "eta_updated":
      return payload?.nearby === true
        ? `${busName} is nearby. ETA: ${String(payload?.etaMinutes ?? "a few")} minutes.`
        : null;
    default:
      return null;
  }
}

async function sendKnockBoardingNotification(payload?: Record<string, unknown> | null) {
  const parentId = getString(payload, "parentId");
  const parentName = getString(payload, "parentName");
  const parentEmail = getString(payload, "parentEmail");
  const busName = getString(payload, "busName");
  const secret = process.env.KNOCK_SECRET_API_SECRET;

  if (!secret || !parentId || !busName) {
    return;
  }

  const knock = new Knock(secret);
  await knock.workflows.trigger("in-bus", {
    data: { bus_product_name: busName },
    recipients: [
      {
        id: parentId,
        name: parentName ?? undefined,
        email: parentEmail ?? undefined,
      },
    ],
  });
}

export async function dispatchTripNotifications({
  tripId,
  eventType,
  payload,
}: TripEventNotificationInput) {
  const message = getTripEventMessage(eventType, payload);

  if (!message) {
    return [];
  }

  const [viewers, trip] = await Promise.all([
    db.tripViewer.findMany({
      where: {
        tripId,
        permissions: { has: "receive_alerts" },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    db.trip.findUnique({ where: { id: tripId }, select: { schoolId: true } }),
  ]);

  const criticalEvents = new Set<TripEventType>([
    "emergency_triggered",
    "emergency_resolved",
    "route_deviation",
    "unusual_stop",
  ]);
  const pushPolicy = trip?.schoolId
    ? await db.schoolNotificationPolicy.findUnique({
        where: {
          schoolId_eventType_channel: {
            schoolId: trip.schoolId,
            eventType,
            channel: "PUSH",
          },
        },
      })
    : null;
  const pushAllowed = criticalEvents.has(eventType) || pushPolicy?.enabled !== false;

  const attempts: Array<{ channel: string; viewerId?: string; status: "sent" | "failed"; error?: string }> = [];

  await Promise.all(
    (pushAllowed ? viewers : []).map(async (viewer) => {
      try {
        await sendPushNotification(message, viewer.viewerId);
        attempts.push({ channel: "push", viewerId: viewer.viewerId, status: "sent" });
      } catch (error) {
        attempts.push({
          channel: "push",
          viewerId: viewer.viewerId,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    })
  );

  const resolved = await getTripOwnerEntitlements(tripId);
  const premiumPreferences = resolved
    ? await db.billingNotificationPreference.findMany({
        where: {
          billingAccountId: resolved.billingAccountId,
          channel: { in: ["SMS", "WHATSAPP"] },
          enabled: true,
          destination: { not: null },
        },
      })
    : [];
  const schoolPremiumPolicies = trip?.schoolId
    ? await db.schoolNotificationPolicy.findMany({
        where: {
          schoolId: trip.schoolId,
          eventType,
          channel: { in: ["SMS", "WHATSAPP"] },
        },
      })
    : [];

  await Promise.all(
    premiumPreferences.map(async (preference) => {
      const channel = preference.channel as "SMS" | "WHATSAPP";
      const channelKey: "sms" | "whatsapp" = channel === "SMS" ? "sms" : "whatsapp";
      const policy = schoolPremiumPolicies.find((item) => item.channel === channel);
      if (policy?.enabled === false || !preference.destination || !resolved) return;
      let deliveryId: string | null = null;
      let providerAccepted = false;
      try {
        await assertPremiumMessageAvailable(resolved, channelKey);
        const delivery = await db.notificationDelivery.create({
          data: {
            billingAccountId: resolved.billingAccountId,
            tripId,
            eventType,
            channel,
            recipient: preference.destination,
            message,
            attemptCount: 1,
          },
        });
        deliveryId = delivery.id;
        const result = await sendPremiumChannel({
          channel,
          destination: preference.destination,
          message,
        });
        providerAccepted = true;
        await db.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            providerMessageId: result.providerMessageId,
          },
        });
        await consumePremiumMessage(resolved, channelKey);
        attempts.push({ channel: channel.toLowerCase(), status: "sent" });
      } catch (error) {
        if (deliveryId && !providerAccepted) {
          await db.notificationDelivery
            .update({
              where: { id: deliveryId },
              data: {
                status: "FAILED",
                failureReason: error instanceof Error ? error.message : "Unknown error",
              },
            })
            .catch(() => undefined);
        }
        attempts.push({
          channel: channel.toLowerCase(),
          status: providerAccepted ? "sent" : "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    })
  );

  if (eventType === "participant_boarded") {
    try {
      await sendKnockBoardingNotification(payload);
      attempts.push({ channel: "knock", status: "sent" });
    } catch (error) {
      attempts.push({
        channel: "knock",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (attempts.length) {
    await db.tripEvent.create({
      data: {
        tripId,
        eventType: "eta_updated",
        actorType: "system",
        payload: {
          source: "notification_dispatch",
          notificationEventType: eventType,
          attempts,
        },
      },
    });
  }

  return attempts;
}
