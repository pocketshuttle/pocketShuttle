import { NextResponse } from "next/server";

import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import db from "@/packages/db/client";

export async function GET() {
  try {
    const { account } = await requireBillingIdentity();
    const suggestions = await db.recurringTripSuggestion.findMany({
      where: { billingAccountId: account.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ suggestions });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
