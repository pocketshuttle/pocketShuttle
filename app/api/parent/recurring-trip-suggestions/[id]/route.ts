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

type Params = { id: string };

function nextRunAtFor(reference: Date | null) {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 7);
  if (reference) {
    next.setHours(reference.getHours(), reference.getMinutes(), 0, 0);
  } else {
    next.setHours(7, 0, 0, 0);
  }
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { session, account } = await requireBillingIdentity();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action === "accept" || body.action === "dismiss" ? body.action : null;
    if (!action) {
      return NextResponse.json({ message: "action must be accept or dismiss" }, { status: 400 });
    }

    const suggestion = await db.recurringTripSuggestion.findFirst({
      where: { id, billingAccountId: account.id, status: "PENDING" },
    });
    if (!suggestion) {
      return NextResponse.json({ message: "Suggestion not found" }, { status: 404 });
    }

    if (action === "dismiss") {
      await db.recurringTripSuggestion.update({
        where: { id },
        data: { status: "DISMISSED", respondedAt: new Date() },
      });
      return NextResponse.json({ message: "Suggestion dismissed" });
    }

    const resolved = await getEntitlements(session);
    requireFeature(resolved, "recurring_trips");
    const count = await db.tripTemplate.count({
      where: { billingAccountId: account.id, isActive: true },
    });
    assertWithinLimit(resolved, "max_recurring_trip_templates", count);

    const lastTrip = suggestion.lastTripId
      ? await db.trip.findUnique({ where: { id: suggestion.lastTripId }, select: { createdAt: true } })
      : null;

    const result = await db.$transaction(async (tx) => {
      const template = await tx.tripTemplate.create({
        data: {
          billingAccountId: account.id,
          createdBy: session.id,
          title: suggestion.destinationLabel || "Recurring trip",
          tripType: "family_trip",
          destination: {
            lat: suggestion.destinationLat,
            lng: suggestion.destinationLng,
            address: suggestion.destinationLabel,
          } as Prisma.InputJsonValue,
          schedule: { frequency: "WEEKLY" } as Prisma.InputJsonValue,
          nextRunAt: nextRunAtFor(lastTrip?.createdAt ?? null),
        },
      });
      await tx.recurringTripSuggestion.update({
        where: { id },
        data: { status: "ACCEPTED", respondedAt: new Date(), createdTemplateId: template.id },
      });
      return template;
    });

    return NextResponse.json({ message: "Recurring trip created", template: result });
  } catch (error) {
    const entitlementResponse = upgradeRequiredResponse(error);
    if (entitlementResponse) return entitlementResponse;
    return billingErrorResponse(error);
  }
}
