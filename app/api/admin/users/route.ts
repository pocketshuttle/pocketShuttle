import { NextResponse } from "next/server";

import { getUnifiedUsers, requirePlatformPermission } from "@/lib/admin/platform";

export async function GET() {
  try {
    await requirePlatformPermission("accounts.read");
    return NextResponse.json({ users: await getUnifiedUsers() });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
