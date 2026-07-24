import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const branding = await db.organizationBranding.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id,
        displayName: body.displayName ? String(body.displayName) : null,
        logoUrl: body.logoUrl ? String(body.logoUrl) : null,
        primaryColor: body.primaryColor ? String(body.primaryColor) : null,
        supportEmail: body.supportEmail ? String(body.supportEmail) : null,
        settings: (body.settings || {}) as Prisma.InputJsonValue,
      },
      update: {
        ...(body.displayName !== undefined ? { displayName: String(body.displayName) } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: String(body.logoUrl) } : {}),
        ...(body.primaryColor !== undefined ? { primaryColor: String(body.primaryColor) } : {}),
        ...(body.supportEmail !== undefined ? { supportEmail: String(body.supportEmail) } : {}),
        ...(body.settings !== undefined ? { settings: body.settings as Prisma.InputJsonValue } : {}),
      },
    });
    return NextResponse.json({ message: "Branding updated", branding });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}
