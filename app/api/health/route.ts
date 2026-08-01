import { NextResponse } from "next/server";

import db from "@/packages/db/client";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", time: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { status: "unavailable", time: new Date().toISOString() },
      { status: 503 }
    );
  }
}
