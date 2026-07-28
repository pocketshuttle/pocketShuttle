import { NextResponse } from "next/server";

import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformPermission("accounts.read");
    const schools = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        suspendedAt: true,
        suspendedReason: true,
        Subscription: { include: { plan: true }, take: 1, orderBy: { startDate: "desc" } },
        _count: { select: { Teacher: true, Driver: true, Parent: true, Student: true, Buses: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ schools });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
