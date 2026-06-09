import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { canManagePlatform, getApiSession } from "@/lib/api-auth";
import { logSuperUserAction } from "@/lib/admin/platform";

type Params = {
  id: string;
};

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await getApiSession();
  if (!canManagePlatform(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const action = String(body.action || "").toLowerCase();

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ message: "Invalid verification action" }, { status: 400 });
  }

  const driver = await db.driver.findFirst({
    where: {
      id: params.id,
      accountType: "STANDALONE",
      schoolId: null,
    },
    select: { id: true },
  });

  if (!driver) {
    return NextResponse.json({ message: "Standalone driver not found" }, { status: 404 });
  }

  const updated = await db.driver.update({
    where: { id: driver.id },
    data: {
      verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED",
      verificationRejectionReason:
        action === "reject" ? String(body.reason || "Verification rejected") : null,
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
}
