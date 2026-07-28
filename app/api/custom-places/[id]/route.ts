import { NextRequest, NextResponse } from "next/server";

import {
  billingErrorResponse,
  requireBillingIdentity,
} from "@/lib/billing/current-account";
import db from "@/packages/db/client";

type Params = { id: string };

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { account } = await requireBillingIdentity();
    const { id } = await params;
    const result = await db.customPlace.updateMany({
      where: { id, billingAccountId: account.id },
      data: { isActive: false },
    });
    if (!result.count) return NextResponse.json({ message: "Place not found" }, { status: 404 });
    return NextResponse.json({ message: "Place disabled" });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
