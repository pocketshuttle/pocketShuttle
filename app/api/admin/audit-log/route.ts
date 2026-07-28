import { NextResponse } from "next/server";

import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformPermission("audit.read");
    const actions = await db.superUserAction.findMany({
      include: { superUser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ actions });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
