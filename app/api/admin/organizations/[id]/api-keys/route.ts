import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { requirePlatformPermission } from "@/lib/admin/platform";
import {
  ENTERPRISE_API_SCOPES,
  generateApiKey,
} from "@/lib/enterprise/api-keys";
import db from "@/packages/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformPermission("accounts.read");
    const { id } = await params;
    const keys = await db.organizationApiKey.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ keys, allowedScopes: ENTERPRISE_API_SCOPES });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requirePlatformPermission("enterprise.manage");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const scopes = Array.isArray(body.scopes)
      ? body.scopes.map(String).filter((scope: string) =>
          ENTERPRISE_API_SCOPES.includes(scope as any)
        )
      : [];
    if (!name || !scopes.length) {
      return NextResponse.json({ message: "Name and at least one valid scope are required" }, { status: 400 });
    }
    const generated = generateApiKey();
    const apiKey = await db.organizationApiKey.create({
      data: {
        organizationId: id,
        name,
        keyPrefix: generated.prefix,
        keyHash: generated.hash,
        scopes,
        rateLimit: Math.min(10_000, Math.max(1, Number(body.rateLimit || 60))),
      },
      select: { id: true, name: true, keyPrefix: true, scopes: true, rateLimit: true },
    });
    return NextResponse.json(
      { message: "API key created. Copy it now; it will not be shown again.", apiKey, token: generated.token },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requirePlatformPermission("enterprise.manage");
    const { id } = await params;
    const keyId = req.nextUrl.searchParams.get("keyId");
    if (!keyId) return NextResponse.json({ message: "keyId is required" }, { status: 400 });
    await db.organizationApiKey.updateMany({
      where: { id: keyId, organizationId: id },
      data: { revokedAt: new Date(), keyHash: crypto.randomBytes(32).toString("hex") },
    });
    return NextResponse.json({ message: "API key revoked" });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
