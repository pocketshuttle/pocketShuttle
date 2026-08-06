import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isDriver } from "@/lib/api-auth";
import { DriverVerificationSchema } from "@/schemas";

export async function PATCH(req: NextRequest) {
  const session = await getApiSession();
  if (!isDriver(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const driver = await db.driver.findFirst({
    where: { id: session.id, accountType: "STANDALONE", schoolId: null },
    select: { id: true, verificationStatus: true },
  });

  if (!driver) {
    return NextResponse.json({ message: "Standalone driver not found" }, { status: 404 });
  }

  if (driver.verificationStatus === "VERIFIED") {
    return NextResponse.json(
      { message: "Verified accounts cannot update verification details. Contact customer care." },
      { status: 403 }
    );
  }

  const parsed = DriverVerificationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await db.driver.update({
    where: { id: driver.id },
    data: {
      image: parsed.data.image,
      phoneNumber: parsed.data.phoneNumber,
      address: parsed.data.address,
      liveAddress: parsed.data.liveAddress,
      landmark: parsed.data.landmark,
      utilityBillUrl: parsed.data.utilityBillUrl,
      identityDocumentUrl: parsed.data.identityDocumentUrl,
      drivingLicenseUrl: parsed.data.drivingLicenseUrl,
      vehicleRegistrationUrl: parsed.data.vehicleRegistrationUrl,
      vehicleInsuranceUrl: parsed.data.vehicleInsuranceUrl,
      verificationStatus: "PENDING_REVIEW",
      verificationRejectionReason: null,
    },
  });

  return NextResponse.json({
    message: "Verification submitted for review",
    driver: updated,
  });
}
