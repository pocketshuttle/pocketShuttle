import { NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { getEntitlements } from "@/lib/billing/entitlements";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!["parent", "admin", "school", "teacher", "driver"].includes(session.role)) {
    return NextResponse.json({ message: "No subscription context" }, { status: 404 });
  }

  try {
    const resolved = await getEntitlements(session);
    return NextResponse.json(resolved);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to resolve entitlements" },
      { status: 400 }
    );
  }
}
