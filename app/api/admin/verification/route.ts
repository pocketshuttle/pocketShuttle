import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { logSuperUserAction, requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformPermission("verification.manage");
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
    assertSameOrigin(req);
    const session = await requirePlatformPermission("verification.manage");
    const body = await req.json();
    const driverId = String(body.driverId || "");
    const action = String(body.action || "").toLowerCase();

    if (!driverId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid verification action" }, { status: 400 });
    }

    const driver = await db.driver.findFirst({
      where: { id: driverId, accountType: "STANDALONE", schoolId: null },
      select: {
        id: true,
        image: true,
        phoneNumber: true,
        address: true,
        liveAddress: true,
        landmark: true,
        utilityBillUrl: true,
        carMake: true,
        carModel: true,
        carColor: true,
        plateNumber: true,
        vehicleCapacity: true,
      },
    });
    if (!driver) {
      return NextResponse.json({ message: "Standalone driver not found" }, { status: 404 });
    }

    const identityRows = await db.$queryRaw<{ identityDocumentUrl: string | null }[]>`
      SELECT "identity_document_url" AS "identityDocumentUrl"
      FROM "Driver"
      WHERE "id" = ${driver.id}
      LIMIT 1
    `;
    const missingFields = [
      !driver.image && "driver image",
      !driver.phoneNumber && "phone number",
      !driver.address && "address",
      !driver.liveAddress && "live GPS location",
      !driver.landmark && "landmark",
      !driver.utilityBillUrl && "utility bill",
      !identityRows[0]?.identityDocumentUrl && "passport/NIN document",
      !driver.carMake && "car make",
      !driver.carModel && "car model",
      !driver.carColor && "car color",
      !driver.plateNumber && "plate number",
      (!driver.vehicleCapacity || driver.vehicleCapacity < 1) && "vehicle capacity",
    ].filter(Boolean);

    if (action === "approve" && missingFields.length) {
      return NextResponse.json(
        { message: `Cannot verify incomplete account. Missing: ${missingFields.join(", ")}` },
        { status: 400 }
      );
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
