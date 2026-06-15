import { redirect } from "next/navigation";

import { StandaloneDriverDashboard } from "@/components/driver/standalone-driver-dashboard";
import { ensureDriverShareProfile } from "@/lib/known-driver-network";
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
      email: true,
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
      shareProfile: { select: { shareId: true } },
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
    shareProfile:
      driver.shareProfile ||
      (await ensureDriverShareProfile({
        id: driver.id,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
      })),
  };

  const connections = await db.parentDriverConnection.findMany({
    where: { driverId: driver.id },
    include: {
      parent: {
        select: {
          id: true,
          full_name: true,
          phoneNumber: true,
          image: true,
        },
      },
      assignments: {
        include: {
          child: true,
          events: {
            where: {
              eventType: { in: ["ON_THE_WAY_TO_SCHOOL", "PICKED_UP", "DROPPED_OFF"] },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const connectionsData = connections.map((connection) => ({
    ...connection,
    assignments: connection.status === "PARENT_APPROVED" ? connection.assignments : [],
  }));

  return <StandaloneDriverDashboard driver={driverData as any} connectionsData={connectionsData as any} />;
};

export default DriverPage;
