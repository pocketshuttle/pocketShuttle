import { NextRequest, NextResponse } from "next/server";

import { logSuperUserAction, requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const drivers = await db.driver.findMany({
      where: { accountType: "STANDALONE", schoolId: null },
      orderBy: [{ verificationStatus: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ drivers });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePlatformAdmin();
    const body = await req.json();
    const driverId = String(body.driverId || "");
    const action = String(body.action || "").toLowerCase();

    if (!driverId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid verification action" }, { status: 400 });
    }

    const driver = await db.driver.findFirst({
      where: { id: driverId, accountType: "STANDALONE", schoolId: null },
      select: { id: true },
    });
    if (!driver) {
      return NextResponse.json({ message: "Standalone driver not found" }, { status: 404 });
    }

    const updated = await db.driver.update({
      where: { id: driver.id },
      data: {
        verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED",
        verificationRejectionReason: action === "reject" ? String(body.reason || "Verification rejected") : null,
      },
    });

    await logSuperUserAction({
      superUserId: session.id,
      action: action === "approve" ? "DRIVER_VERIFICATION_APPROVED" : "DRIVER_VERIFICATION_REJECTED",
      targetId: `driver:${driver.id}`,
      metadata: { reason: body.reason || null },
    });

    return NextResponse.json({
      message: action === "approve" ? "Driver verified" : "Driver rejected",
      driver: updated,
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
