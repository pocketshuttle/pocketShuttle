import "server-only";

import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { sendPushNotification } from "@/onesignal/send-push";
import { getPusherInstance } from "@/pusher/server";
import db from "@/packages/db/client";

const DRIVER_SHARE_PREFIX = "PKD";
const INVITE_TOKEN_BYTES = 24;

export const KNOWN_DRIVER_MONTHLY_AMOUNT = Number(
  process.env.KNOWN_DRIVER_MONTHLY_AMOUNT || 0
);

export function normalizeLookup(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function randomShareId() {
  return `${DRIVER_SHARE_PREFIX}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function ensureDriverShareProfile(driver: {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
}) {
  const existing = await db.driverShareProfile.findUnique({
    where: { driverId: driver.id },
  });

  if (existing) {
    return db.driverShareProfile.update({
      where: { driverId: driver.id },
      data: {
        searchableEmail: driver.email ? normalizeLookup(driver.email) : null,
        searchablePhone: driver.phoneNumber ? normalizePhone(driver.phoneNumber) : null,
      },
    });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await db.driverShareProfile.create({
        data: {
          driverId: driver.id,
          shareId: randomShareId(),
          searchableEmail: driver.email ? normalizeLookup(driver.email) : null,
          searchablePhone: driver.phoneNumber ? normalizePhone(driver.phoneNumber) : null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to generate driver share ID");
}

export function createInviteToken() {
  const token = crypto.randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function getOneMonthFrom(date = new Date()) {
  const trialEndsAt = new Date(date);
  trialEndsAt.setMonth(trialEndsAt.getMonth() + 1);
  return trialEndsAt;
}

export async function sendKnownDriverRealtimeEvent({
  parentId,
  driverId,
  event,
}: {
  parentId: string;
  driverId: string;
  event: string;
}) {
  try {
    const pusher = getPusherInstance();
    await pusher.trigger(`private-known-driver-parent-${parentId}`, event, {
      driverId,
    });
    await pusher.trigger(`private-known-driver-driver-${driverId}`, event, {
      parentId,
    });
  } catch (error) {
    console.error("Known driver realtime event failed:", error);
  }
}

export async function recordChildDriverEvent({
  assignmentId,
  eventType,
  actorId,
  actorType,
  latitude,
  longitude,
  payload,
  notifyParent = true,
}: {
  assignmentId: string;
  eventType: "ON_THE_WAY_TO_SCHOOL" | "PICKED_UP" | "DROPPED_OFF" | "LOCATION_UPDATED" | "LOCATION_REQUESTED" | "ALERT_SENT";
  actorId?: string | null;
  actorType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  payload?: Prisma.InputJsonValue;
  notifyParent?: boolean;
}) {
  const assignment = await db.childDriverAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      parent: { select: { id: true, full_name: true } },
      driver: { select: { id: true, full_name: true } },
      child: { select: { id: true, fullName: true } },
    },
  });

  if (!assignment || assignment.status !== "ACTIVE") {
    throw new Error("Assignment not found");
  }

  const event = await db.$transaction(async (tx) => {
    const created = await tx.childDriverEvent.create({
      data: {
        assignmentId: assignment.id,
        parentId: assignment.parentId,
        driverId: assignment.driverId,
        childId: assignment.childId,
        eventType,
        actorId: actorId ?? null,
        actorType: actorType ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        payload: payload ?? undefined,
      },
    });

    await tx.childDriverAssignment.update({
      where: { id: assignment.id },
      data: {
        lastStatus: eventType,
        lastStatusAt: new Date(),
      },
    });

    return created;
  });

  await sendKnownDriverRealtimeEvent({
    parentId: assignment.parentId,
    driverId: assignment.driverId,
    event: "child-driver-event",
  });

  if (notifyParent && eventType !== "LOCATION_UPDATED" && eventType !== "LOCATION_REQUESTED") {
    const label =
      eventType === "ON_THE_WAY_TO_SCHOOL"
        ? "is on the way to school"
        : eventType === "PICKED_UP"
          ? "has been picked up"
          : "has been dropped off";

    try {
      await sendPushNotification(
        `${assignment.child.fullName} ${label} with ${assignment.driver.full_name}.`,
        assignment.parentId
      );
      await db.childDriverEvent.create({
        data: {
          assignmentId: assignment.id,
          parentId: assignment.parentId,
          driverId: assignment.driverId,
          childId: assignment.childId,
          eventType: "ALERT_SENT",
          actorType: "system",
          payload: { source: "push", originalEventType: eventType },
        },
      });
    } catch (error) {
      console.error("Known driver parent alert failed:", error);
    }
  }

  return event;
}
