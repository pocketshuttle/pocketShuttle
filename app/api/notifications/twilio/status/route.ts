import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

import db from "@/packages/db/client";
import { releasePremiumMessage } from "@/lib/billing/premium-messages";

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return NextResponse.json({ message: "Twilio is not configured" }, { status: 503 });
  }
  const form = await req.formData();
  const params = Object.fromEntries(
    Array.from(form.entries()).map(([key, value]) => [key, String(value)])
  );
  const signature = req.headers.get("x-twilio-signature") || "";
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  const webhookUrl = publicBase
    ? `${publicBase.replace(/\/$/, "")}/api/notifications/twilio/status`
    : req.url;
  if (!twilio.validateRequest(authToken, signature, webhookUrl, params)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }
  const providerMessageId = params.MessageSid;
  const providerStatus = params.MessageStatus?.toLowerCase();
  if (!providerMessageId) {
    return NextResponse.json({ received: true });
  }
  const status =
    providerStatus === "delivered" || providerStatus === "read"
      ? "DELIVERED"
      : ["failed", "undelivered"].includes(providerStatus)
        ? "FAILED"
        : "ACCEPTED";
  const delivery = await db.notificationDelivery.findUnique({ where: { providerMessageId } });
  if (delivery) {
    await db.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(status === "FAILED"
          ? { failureReason: params.ErrorMessage || params.ErrorCode || "Provider delivery failed" }
          : {}),
      },
    });
    if (status === "FAILED" && delivery.status !== "FAILED" && delivery.acceptedAt) {
      await releasePremiumMessage(
        delivery.billingAccountId,
        delivery.channel,
        delivery.acceptedAt
      );
    }
  }
  return NextResponse.json({ received: true });
}
