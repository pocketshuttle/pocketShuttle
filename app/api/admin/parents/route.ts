import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const parents = await db.parent.findMany({
      include: {
        school: { select: { id: true, name: true, email: true } },
        _count: { select: { Student: true, ParentChild: true, DriverRequest: true } },
      },
      orderBy: { full_name: "asc" },
    });

    return NextResponse.json({ parents });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
