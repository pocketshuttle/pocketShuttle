import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isParent } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const routeArea = new URL(req.url).searchParams.get("routeArea")?.trim();

  const drivers = await db.driver.findMany({
    where: {
      accountType: "STANDALONE",
      schoolId: null,
      ...(routeArea
        ? {
            serviceAreas: {
              has: routeArea,
            },
          }
        : {}),
    },
    select: {
      id: true,
      full_name: true,
      liveAddress: true,
      image: true,
      serviceAreas: true,
      carMake: true,
      carModel: true,
      carColor: true,
      plateNumber: true,
      vehicleCapacity: true,
      verificationStatus: true,
    },
    orderBy: [{ verificationStatus: "asc" }, { full_name: "asc" }],
  });

  const acceptedLoads = drivers.length
    ? await db.driverRequest.groupBy({
        by: ["driverId"],
        where: {
          driverId: { in: drivers.map((driver) => driver.id) },
          status: "ACCEPTED",
          droppedOffAt: null,
        },
        _count: { _all: true },
      })
    : [];

  const loadByDriverId = new Map(
    acceptedLoads.map((load) => [load.driverId, load._count._all])
  );

  return NextResponse.json({
    drivers: drivers.map((driver) => {
      const usedSeats = loadByDriverId.get(driver.id) || 0;
      const capacity = driver.vehicleCapacity || 0;
      const availableSeats = capacity ? Math.max(capacity - usedSeats, 0) : null;

      return {
        ...driver,
        usedSeats,
        availableSeats,
        isFull: capacity ? usedSeats >= capacity : false,
      };
    }),
  });
}
