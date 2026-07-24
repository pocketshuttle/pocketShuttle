import "server-only";

import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { decryptSecret } from "@/lib/enterprise/secrets";
import db from "@/packages/db/client";

export async function enqueueOrganizationWebhookEvent(input: {
  organizationId: string;
  eventId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}) {
  const webhooks = await db.outboundWebhook.findMany({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      eventTypes: { has: input.eventType },
    },
    select: { id: true },
  });
  if (!webhooks.length) return;
  await db.outboundWebhookDelivery.createMany({
    data: webhooks.map((webhook) => ({
      webhookId: webhook.id,
      eventId: input.eventId,
      eventType: input.eventType,
      payload: input.payload,
      nextAttemptAt: new Date(),
    })),
    skipDuplicates: true,
  });
}

export async function enqueueSchoolWebhookEvent(input: {
  schoolId: string;
  eventId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}) {
  const branch = await db.organizationBranch.findUnique({
    where: { schoolId: input.schoolId },
    select: { organizationId: true, id: true },
  });
  if (!branch) return;
  await enqueueOrganizationWebhookEvent({
    organizationId: branch.organizationId,
    eventId: input.eventId,
    eventType: input.eventType,
    payload: {
      branchId: branch.id,
      schoolId: input.schoolId,
      data: input.payload,
    },
  });
}

export async function deliverPendingWebhooks(limit = 50) {
  const deliveries = await db.outboundWebhookDelivery.findMany({
    where: {
      status: { in: ["PENDING", "RETRYING"] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    include: { webhook: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  for (const delivery of deliveries) {
    const body = JSON.stringify({
      id: delivery.eventId,
      type: delivery.eventType,
      createdAt: delivery.createdAt.toISOString(),
      data: delivery.payload,
    });
    try {
      const secret = decryptSecret(delivery.webhook.secretCiphertext);
      const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
      const response = await fetch(delivery.webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PocketShuttle-Signature": `sha256=${signature}`,
          "X-PocketShuttle-Event": delivery.eventType,
        },
        body,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await db.outboundWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "DELIVERED",
          attemptCount: { increment: 1 },
          responseStatus: response.status,
          deliveredAt: new Date(),
          nextAttemptAt: null,
          lastError: null,
        },
      });
    } catch (error) {
      const attempts = delivery.attemptCount + 1;
      const exhausted = attempts >= 8;
      const delayMinutes = Math.min(24 * 60, 2 ** attempts);
      await db.outboundWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: exhausted ? "FAILED" : "RETRYING",
          attemptCount: attempts,
          nextAttemptAt: exhausted
            ? null
            : new Date(Date.now() + delayMinutes * 60 * 1000),
          lastError: error instanceof Error ? error.message : "Delivery failed",
        },
      });
    }
  }
  return deliveries.length;
}
