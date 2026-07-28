import { NextRequest, NextResponse } from "next/server";

import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET(request: NextRequest) {
  try {
    await requirePlatformPermission("operations.read");
    const status = request.nextUrl.searchParams.get("status");
    const safety = request.nextUrl.searchParams.get("safety");
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const trips = await db.trip.findMany({
      where: {
        ...(status && status !== "all" ? { status: status as any } : {}),
        ...(safety && safety !== "all" ? { safetyState: safety as any } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { id: { contains: search, mode: "insensitive" } },
                { driverId: { contains: search, mode: "insensitive" } },
                { vehicleId: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        locations: { orderBy: { timestamp: "desc" }, take: 1 },
        events: { orderBy: { timestamp: "desc" }, take: 5 },
        _count: { select: { participants: true, viewers: true, events: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ trips });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load trips";
    return NextResponse.json(
      { message },
      { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400 }
    );
  }
}
