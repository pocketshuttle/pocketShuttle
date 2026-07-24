import { NextRequest, NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const branches = await db.organizationBranch.findMany({
      where: { organizationId: id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ branches });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const schoolId = String(body.schoolId || "");
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim().toUpperCase();
    const school = await db.user.findUnique({ where: { id: schoolId }, select: { id: true } });
    if (!school || !name || !code) {
      return NextResponse.json({ message: "Valid school, name, and code are required" }, { status: 400 });
    }
    const branch = await db.organizationBranch.create({
      data: { organizationId: id, schoolId, name, code },
    });
    return NextResponse.json({ message: "Branch added", branch }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}
