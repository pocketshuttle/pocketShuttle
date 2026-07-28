import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { logSuperUserAction, requirePlatformPermission } from "@/lib/admin/platform";
import { ensurePlanCatalog } from "@/lib/billing/accounts";
import { normalizeEntitlements, PLAN_CODES } from "@/lib/billing/catalog";
import db from "@/packages/db/client";

export async function GET() {
  try {
    await requirePlatformPermission("accounts.read");
    const organizations = await db.organization.findMany({
      include: {
        branches: true,
        billingAccount: {
          include: {
            subscriptions: {
              include: { plan: true },
              orderBy: { startDate: "desc" },
            },
          },
        },
        _count: { select: { members: true, apiKeys: true, webhooks: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ organizations });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requirePlatformPermission("enterprise.manage");
    await ensurePlanCatalog();
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const slug = String(body.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!name || slug.length < 3) throw new Error("Name and a valid slug are required");
    const plan = await db.plan.findUnique({ where: { code: PLAN_CODES.ENTERPRISE } });
    if (!plan) throw new Error("Enterprise plan is unavailable");
    const overrides = normalizeEntitlements(body.entitlementOverrides);

    const organization = await db.$transaction(async (tx) => {
      const created = await tx.organization.create({ data: { name, slug } });
      const account = await tx.billingAccount.create({
        data: {
          type: "ORGANIZATION",
          organizationId: created.id,
          billingEmail: body.billingEmail ? String(body.billingEmail) : null,
          entitlementOverrides: overrides as Prisma.InputJsonValue,
          enforcementEnabled: true,
          rolloutFlags: {
            onboardingStatus: "PENDING",
            supportTarget: body.supportTarget || "DEDICATED",
            sla: body.sla || null,
          },
        },
      });
      await tx.subscription.create({
        data: {
          billingAccountId: account.id,
          planId: plan.id,
          subscriptionPlan: "ENTERPRISE",
          provider: "MANUAL",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: body.currentPeriodEnd
            ? new Date(body.currentPeriodEnd)
            : null,
        },
      });
      if (body.branch?.schoolId && body.branch?.name) {
        await tx.organizationBranch.create({
          data: {
            organizationId: created.id,
            schoolId: String(body.branch.schoolId),
            name: String(body.branch.name),
            code: String(body.branch.code || "MAIN").toUpperCase(),
          },
        });
      }
      return created;
    });
    await logSuperUserAction({
      superUserId: session.id,
      action: "ORGANIZATION_CREATED",
      targetId: `organization:${organization.id}`,
      metadata: { name, slug },
    });
    return NextResponse.json({ message: "Enterprise organization created", organization }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}
