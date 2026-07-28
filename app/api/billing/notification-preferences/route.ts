import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import { getEntitlements, requireFeature } from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

const channels = ["PUSH", "SMS", "WHATSAPP"] as const;

export async function GET() {
  try {
    const { account } = await requireBillingIdentity();
    const saved = await db.billingNotificationPreference.findMany({
      where: { billingAccountId: account.id },
    });
    return NextResponse.json({
      preferences: channels.map((channel) => {
        const preference = saved.find((item) => item.channel === channel);
        return {
          channel,
          enabled: channel === "PUSH" ? preference?.enabled !== false : preference?.enabled === true,
          destination: preference?.destination ?? null,
          consentedAt: preference?.consentedAt ?? null,
        };
      }),
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const { session, account } = await requireBillingIdentity();
    const body = await req.json().catch(() => ({}));
    const channel = String(body.channel || "").toUpperCase() as (typeof channels)[number];
    const enabled = body.enabled === true;
    if (!channels.includes(channel)) {
      return NextResponse.json({ message: "Invalid notification channel" }, { status: 400 });
    }
    if (enabled && channel !== "PUSH") {
      requireFeature(await getEntitlements(session), "premium_notifications");
    }
    const destination = body.destination ? String(body.destination).trim() : null;
    if (
      enabled &&
      channel !== "PUSH" &&
      (!destination || !/^\+[1-9]\d{7,14}$/.test(destination))
    ) {
      return NextResponse.json(
        { message: "Use an international phone number such as +2348012345678" },
        { status: 400 }
      );
    }
    const preference = await db.billingNotificationPreference.upsert({
      where: { billingAccountId_channel: { billingAccountId: account.id, channel } },
      create: {
        billingAccountId: account.id,
        channel,
        enabled,
        destination,
        consentedAt: enabled ? new Date() : null,
      },
      update: {
        enabled,
        destination,
        consentedAt: enabled ? new Date() : null,
      },
    });
    return NextResponse.json({ message: "Notification preference updated", preference });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return billingErrorResponse(error);
  }
}
