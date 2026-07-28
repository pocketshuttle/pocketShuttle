import { NextRequest, NextResponse } from "next/server";

import { getEntitlements, requireFeature } from "@/lib/billing/entitlements";
import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

export async function GET() {
  try {
    const { account } = await requireBillingIdentity();
    const places = await db.customPlace.findMany({
      where: { billingAccountId: account.id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ places });
  } catch (error) {
    return billingErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, account } = await requireBillingIdentity();
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "geofences");
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const radiusMeters = Math.round(Number(body.radiusMeters || 250));
    if (
      !name ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      radiusMeters < 50 ||
      radiusMeters > 5000
    ) {
      return NextResponse.json({ message: "Invalid place details" }, { status: 400 });
    }
    const place = await db.customPlace.create({
      data: {
        billingAccountId: account.id,
        name,
        latitude,
        longitude,
        radiusMeters,
        placeType: body.placeType ? String(body.placeType) : "custom",
      },
    });
    return NextResponse.json({ message: "Place created", place }, { status: 201 });
  } catch (error) {
    const entitlementResponse = upgradeRequiredResponse(error);
    if (entitlementResponse) return entitlementResponse;
    return billingErrorResponse(error);
  }
}
