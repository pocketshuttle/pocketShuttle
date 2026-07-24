import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { logSuperUserAction, requirePlatformAdmin } from "@/lib/admin/platform";
import {
  FEATURE_KEYS,
  LIMIT_KEYS,
  normalizeEntitlements,
} from "@/lib/billing/catalog";
import db from "@/packages/db/client";

const knownKeys = new Set<string>([...FEATURE_KEYS, ...LIMIT_KEYS]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePlatformAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    let overrides: Record<string, boolean | number | null> | undefined;
    if (body.entitlementOverrides !== undefined) {
      if (
        !body.entitlementOverrides ||
        typeof body.entitlementOverrides !== "object" ||
        Array.isArray(body.entitlementOverrides)
      ) {
        throw new Error("entitlementOverrides must be an object");
      }
      const unknown = Object.keys(body.entitlementOverrides).filter(
        (key) => !knownKeys.has(key)
      );
      if (unknown.length) {
        throw new Error(`Unknown entitlement keys: ${unknown.join(", ")}`);
      }
      overrides = normalizeEntitlements(body.entitlementOverrides);
    }
    const account = await db.billingAccount.update({
      where: { id },
      data: {
        ...(body.billingEmail !== undefined
          ? { billingEmail: body.billingEmail ? String(body.billingEmail) : null }
          : {}),
        ...(body.enforcementEnabled !== undefined
          ? { enforcementEnabled: Boolean(body.enforcementEnabled) }
          : {}),
        ...(overrides !== undefined
          ? { entitlementOverrides: overrides as Prisma.InputJsonValue }
          : {}),
        ...(body.rolloutFlags !== undefined
          ? { rolloutFlags: body.rolloutFlags as Prisma.InputJsonValue }
          : {}),
      },
    });
    await logSuperUserAction({
      superUserId: session.id,
      action: "BILLING_ACCOUNT_UPDATED",
      targetId: `billing-account:${account.id}`,
      metadata: {
        enforcementEnabled: account.enforcementEnabled,
        entitlementOverrides: account.entitlementOverrides,
        rolloutFlags: account.rolloutFlags,
      },
    });
    return NextResponse.json({ message: "Billing account updated", account });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message !== "UNAUTHORIZED"
            ? error.message
            : "Unauthorized",
      },
      {
        status:
          error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401,
      }
    );
  }
}
