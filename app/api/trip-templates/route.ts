import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import {
  assertWithinLimit,
  getEntitlements,
  requireFeature,
} from "@/lib/billing/entitlements";
import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

export async function GET() {
  try {
    const { account } = await requireBillingIdentity();
    const templates = await db.tripTemplate.findMany({
      where: { billingAccountId: account.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    return billingErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, account } = await requireBillingIdentity();
    const body = await req.json().catch(() => ({}));
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "recurring_trips");
    const count = await db.tripTemplate.count({
      where: { billingAccountId: account.id, isActive: true },
    });
    assertWithinLimit(resolved, "max_recurring_trip_templates", count);

    const title = String(body.title || "").trim();
    const tripType = String(body.tripType || "family_trip");
    const schedule = body.schedule;
    const frequency =
      schedule && typeof schedule === "object" ? String(schedule.frequency || "") : "";
    const nextRunAt = new Date(body.nextRunAt);
    if (!title || !["family_trip", "school_trip", "interstate_trip", "corporate_trip"].includes(tripType)) {
      return NextResponse.json({ message: "Invalid title or trip type" }, { status: 400 });
    }
    if (!["DAILY", "WEEKLY"].includes(frequency) || Number.isNaN(nextRunAt.getTime())) {
      return NextResponse.json(
        { message: "Schedule requires DAILY or WEEKLY frequency and a valid nextRunAt" },
        { status: 400 }
      );
    }

    const template = await db.tripTemplate.create({
      data: {
        billingAccountId: account.id,
        createdBy: session.id,
        title,
        tripType: tripType as any,
        origin: body.origin as Prisma.InputJsonValue | undefined,
        destination: body.destination as Prisma.InputJsonValue | undefined,
        schedule: schedule as Prisma.InputJsonValue,
        nextRunAt,
        metadata:
          body.metadata && typeof body.metadata === "object"
            ? (body.metadata as Prisma.InputJsonValue)
            : undefined,
      },
    });
    return NextResponse.json({ message: "Recurring trip created", template }, { status: 201 });
  } catch (error) {
    const entitlementResponse = upgradeRequiredResponse(error);
    if (entitlementResponse) return entitlementResponse;
    return billingErrorResponse(error);
  }
}
