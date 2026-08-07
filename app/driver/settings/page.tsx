import { redirect } from "next/navigation";

import { DriverSettingsView } from "@/components/driver/driver-settings-view";
import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";

const DriverSettingsPage = async () => {
  const user = await getUserSession();

  if (user?.role !== "driver" || typeof user.id !== "string") {
    redirect("/login");
  }

  const driver = await db.driver.findFirst({
    where: { id: user.id, accountType: "STANDALONE", schoolId: null },
    select: { verificationStatus: true },
  });

  if (!driver) {
    redirect("/driver");
  }

  return <DriverSettingsView verificationStatus={driver.verificationStatus} />;
};

export default DriverSettingsPage;
