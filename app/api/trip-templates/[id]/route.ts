import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getEntitlements, requireFeature } from "@/lib/billing/entitlements";
import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

type Params = { id: string };

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { session, account } = await requireBillingIdentity();
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "recurring_trips");
    const { id } = await params;
    const existing = await db.tripTemplate.findFirst({
      where: { id, billingAccountId: account.id },
    });
    if (!existing) return NextResponse.json({ message: "Template not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const nextRunAt = body.nextRunAt !== undefined ? new Date(body.nextRunAt) : undefined;
    if (nextRunAt && Number.isNaN(nextRunAt.getTime())) {
      return NextResponse.json({ message: "Invalid nextRunAt" }, { status: 400 });
    }
    const template = await db.tripTemplate.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.schedule !== undefined
          ? { schedule: body.schedule as Prisma.InputJsonValue }
          : {}),
        ...(nextRunAt ? { nextRunAt } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });
    return NextResponse.json({ message: "Template updated", template });
  } catch (error) {
    const entitlementResponse = upgradeRequiredResponse(error);
    if (entitlementResponse) return entitlementResponse;
    return billingErrorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { account } = await requireBillingIdentity();
    const { id } = await params;
    const result = await db.tripTemplate.updateMany({
      where: { id, billingAccountId: account.id },
      data: { isActive: false, nextRunAt: null },
    });
    if (!result.count) return NextResponse.json({ message: "Template not found" }, { status: 404 });
    return NextResponse.json({ message: "Template disabled" });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
