import { NextResponse } from "next/server";

import { getPlatformOverview, requirePlatformPermission } from "@/lib/admin/platform";

export async function GET() {
  try {
    await requirePlatformPermission("overview.read");
    return NextResponse.json(await getPlatformOverview());
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
