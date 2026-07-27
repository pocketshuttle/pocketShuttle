import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { requireBillingIdentity } from "@/lib/billing/current-account";
import db from "@/packages/db/client";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; id: string }> }
) {
  try {
    assertSameOrigin(req);
    const { account } = await requireBillingIdentity();
    const { tripId, id } = await params;
    const result = await db.tripViewerInvite.updateMany({
      where: { id, tripId, billingAccountId: account.id, status: "PENDING" },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    if (!result.count) return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    return NextResponse.json({ message: "Invitation revoked" });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
