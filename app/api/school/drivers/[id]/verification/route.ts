import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { canManageSchool, getApiSession } from "@/lib/api-auth";
import { getEntitlements, requireFeature } from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertSameOrigin(req);
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "driver_verification");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid verification action" }, { status: 400 });
    }
    const driver = await db.driver.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!driver) return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    const updated = await db.driver.update({
      where: { id },
      data: {
        verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED",
        verificationRejectionReason:
          action === "reject" ? String(body.reason || "Rejected by school") : null,
      },
    });
    await db.auditLog.create({
      data: {
        userId: schoolId,
        action: action === "approve" ? "DRIVER_VERIFICATION_APPROVED" : "DRIVER_VERIFICATION_REJECTED",
        details: { driverId: id, actorId: session.id, reason: body.reason || null },
      },
    });
    return NextResponse.json({ message: "Driver verification updated", driver: updated });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json({ message: "Unable to update verification" }, { status: 400 });
  }
}
