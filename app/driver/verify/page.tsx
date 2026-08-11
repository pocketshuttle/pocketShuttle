import { redirect } from "next/navigation";

import { DriverVerificationWizard } from "@/components/driver/driver-verification-wizard";
import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";

const DriverVerifyPage = async () => {
  const user = await getUserSession();

  if (user?.role !== "driver" || typeof user.id !== "string") {
    redirect("/login");
  }

  const driver = await db.driver.findFirst({
    where: {
      id: user.id,
      accountType: "STANDALONE",
      schoolId: null,
    },
    select: {
      id: true,
      full_name: true,
      image: true,
      phoneNumber: true,
      address: true,
      liveAddress: true,
      landmark: true,
      utilityBillUrl: true,
      identityDocumentUrl: true,
      drivingLicenseUrl: true,
      vehicleRegistrationUrl: true,
      vehicleInsuranceUrl: true,
      verificationStatus: true,
      verificationRejectionReason: true,
    },
  });

  if (!driver) {
    redirect("/dashboard");
  }

  return <DriverVerificationWizard driver={driver as any} />;
};

export default DriverVerifyPage;
