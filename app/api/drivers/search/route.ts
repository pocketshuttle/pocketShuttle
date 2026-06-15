import { NextRequest, NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import { ensureDriverShareProfile, normalizeLookup, normalizePhone } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

export async function GET(req: NextRequest) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(req.url).searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ drivers: [] });
  }

  const normalized = normalizeLookup(query);
  const phone = normalizePhone(query);

  const drivers = await db.driver.findMany({
    where: {
      accountType: "STANDALONE",
      schoolId: null,
      OR: [
        { email: normalized },
        { phoneNumber: query },
        { phoneNumber: phone },
        { shareProfile: { shareId: query.toUpperCase() } },
        { shareProfile: { searchableEmail: normalized } },
        { shareProfile: { searchablePhone: phone } },
      ],
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      phoneNumber: true,
      image: true,
      verificationStatus: true,
      carMake: true,
      carModel: true,
      carColor: true,
      plateNumber: true,
      vehicleCapacity: true,
      shareProfile: { select: { shareId: true } },
      parentConnections: {
        where: { parentId: session.id },
        select: { id: true, status: true },
        take: 1,
      },
      _count: { select: { childAssignments: true } },
    },
    take: 10,
  });

  const driversWithShareIds = await Promise.all(
    drivers.map(async (driver) => {
      const shareProfile =
        driver.shareProfile ||
        (await ensureDriverShareProfile({
          id: driver.id,
          email: driver.email,
          phoneNumber: driver.phoneNumber,
        }));

      return {
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        image: driver.image,
        verificationStatus: driver.verificationStatus,
        vehicle: [driver.carColor, driver.carMake, driver.carModel, driver.plateNumber]
          .filter(Boolean)
          .join(" "),
        vehicleCapacity: driver.vehicleCapacity,
        shareId: shareProfile.shareId,
        existingConnection: driver.parentConnections[0] || null,
        activeAssignmentCount: driver._count.childAssignments,
      };
    })
  );

  return NextResponse.json({ drivers: driversWithShareIds });
}
