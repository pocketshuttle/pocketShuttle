import { NextResponse } from "next/server";

import { getPlatformOverview, requirePlatformAdmin } from "@/lib/admin/platform";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return NextResponse.json(await getPlatformOverview());
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
