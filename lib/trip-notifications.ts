import "server-only";

import { Knock } from "@knocklabs/node";

import { sendSmsForBusArrival } from "@/actions/notification/bus-arrival";
import { sendPushNotification } from "@/onesignal/send-push";
import db from "@/packages/db/client";
import { TripEventType } from "@prisma/client";

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

  const viewers = await db.tripViewer.findMany({
    where: {
      tripId,
      permissions: { has: "receive_alerts" },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  const attempts: Array<{ channel: string; viewerId?: string; status: "sent" | "failed"; error?: string }> = [];

  await Promise.all(
    viewers.map(async (viewer) => {
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

  if (eventType === "trip_started") {
    const phoneNumber = getString(payload, "parentPhone");
    if (phoneNumber) {
      try {
        await sendSmsForBusArrival({
          student_name: getString(payload, "studentName") ?? "",
          parent_name: getString(payload, "parentName") ?? "",
          bus_name: getString(payload, "busName") ?? "Vehicle",
          phoneNumber,
          eta: getString(payload, "eta") ?? "unknown",
        });
        attempts.push({ channel: "sms", status: "sent" });
      } catch (error) {
        attempts.push({
          channel: "sms",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

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
