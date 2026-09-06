import "server-only";

import { MobileSubjectRole, Prisma } from "@prisma/client";

import { MobileApiError } from "@/lib/mobile/errors";
import db from "@/packages/db/client";

type EventActor = {
  id: string;
  role: "parent" | "driver" | "teacher";
};

export async function runDeduplicatedMobileEvent<T>(input: {
  actor: EventActor;
  clientEventId?: unknown;
  eventType: string;
  action: () => Promise<T>;
}) {
  const clientEventId =
    typeof input.clientEventId === "string"
      ? input.clientEventId.trim().slice(0, 200)
      : "";
  if (!clientEventId) return { value: await input.action(), duplicate: false };

  const existing = await db.mobileEventReceipt.findUnique({
    where: { clientEventId },
  });
  if (existing) {
    if (
      existing.subjectId !== input.actor.id ||
      existing.subjectRole !== input.actor.role.toUpperCase()
    ) {
      throw new MobileApiError(
        "CONFLICT",
        409,
        "This event identifier is already in use."
      );
    }
    return { value: existing.result as T, duplicate: true };
  }

  const value = await input.action();
  try {
    await db.mobileEventReceipt.create({
      data: {
        clientEventId,
        subjectRole: input.actor.role.toUpperCase() as MobileSubjectRole,
        subjectId: input.actor.id,
        eventType: input.eventType,
        result: JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await db.mobileEventReceipt.findUnique({
        where: { clientEventId },
      });
      return { value: raced?.result as T, duplicate: true };
    }
    throw error;
  }
  return { value, duplicate: false };
}
