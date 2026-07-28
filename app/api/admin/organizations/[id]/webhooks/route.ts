import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { requirePlatformPermission } from "@/lib/admin/platform";
import { encryptSecret } from "@/lib/enterprise/secrets";
import db from "@/packages/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformPermission("accounts.read");
    const { id } = await params;
    const webhooks = await db.outboundWebhook.findMany({
      where: { organizationId: id },
      select: { id: true, url: true, eventTypes: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ webhooks });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requirePlatformPermission("enterprise.manage");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const url = new URL(String(body.url || ""));
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
      return NextResponse.json({ message: "Webhook URLs must use HTTPS" }, { status: 400 });
    }
    const eventTypes = Array.isArray(body.eventTypes)
      ? body.eventTypes.map(String).filter(Boolean)
      : [];
    if (!eventTypes.length) {
      return NextResponse.json({ message: "At least one event type is required" }, { status: 400 });
    }
    const secret = crypto.randomBytes(32).toString("base64url");
    const webhook = await db.outboundWebhook.create({
      data: {
        organizationId: id,
        url: url.toString(),
        eventTypes,
        secretCiphertext: encryptSecret(secret),
      },
      select: { id: true, url: true, eventTypes: true, isActive: true },
    });
    return NextResponse.json(
      { message: "Webhook created. Copy the signing secret now.", webhook, secret },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}
