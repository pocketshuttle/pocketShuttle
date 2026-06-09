import { NextResponse } from "next/server";

import { getUnifiedUsers, requirePlatformAdmin } from "@/lib/admin/platform";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return NextResponse.json({ users: await getUnifiedUsers() });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
