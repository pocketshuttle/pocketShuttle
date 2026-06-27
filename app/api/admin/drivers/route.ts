import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const drivers = await db.driver.findMany({
      include: {
        school: { select: { id: true, name: true, email: true } },
        _count: { select: { DriverRequest: true, ParentChild: true } },
      },
      orderBy: [{ accountType: "asc" }, { full_name: "asc" }],
    });

    return NextResponse.json({ drivers });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
