import { redirect } from "next/navigation";

import { StandaloneDriverDashboard } from "@/components/driver/standalone-driver-dashboard";
import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";

const DriverPage = async () => {
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
      verificationStatus: true,
      verificationRejectionReason: true,
      serviceAreas: true,
      carMake: true,
      carModel: true,
      carColor: true,
      plateNumber: true,
      vehicleCapacity: true,
    },
  });

  if (!driver) {
    redirect("/dashboard");
  }

  const identityRows = await db.$queryRaw<{ identityDocumentUrl: string | null }[]>`
    SELECT "identity_document_url" AS "identityDocumentUrl"
    FROM "Driver"
    WHERE "id" = ${driver.id}
    LIMIT 1
  `;
  const driverData = {
    ...driver,
    identityDocumentUrl: identityRows[0]?.identityDocumentUrl || null,
  };

  const requests = await db.driverRequest.findMany({
    where: { driverId: driver.id },
    include: {
      child: true,
      parent: {
        select: {
          id: true,
          full_name: true,
          phoneNumber: true,
          address: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const requestsData = requests.map((request) => ({
    ...request,
    parent: {
      ...request.parent,
      address: request.status === "ACCEPTED" ? request.parent.address : null,
    },
    parentPickupCount: requests.filter(
      (item) =>
        item.parentId === request.parentId &&
        ["PENDING", "ACCEPTED"].includes(item.status) &&
        !item.droppedOffAt
    ).length,
    child: {
      ...request.child,
      address: request.pickedUpAt ? request.child.address : null,
    },
  }));

  return <StandaloneDriverDashboard driver={driverData as any} requestsData={requestsData as any} />;
};

export default DriverPage;
