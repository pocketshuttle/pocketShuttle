import { NextRequest, NextResponse } from "next/server";

import { defaultFreePlanCode } from "@/lib/billing/catalog";
import { assertSameOrigin } from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import db from "@/packages/db/client";

const actions = new Set(["FALLBACK_FREE", "CANCEL_END_PERIOD", "ASSIGN_PLAN"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("billing.manage");
    const { id } = await params;
    const body = await request.json();
    const action = String(body.action || "").toUpperCase();
    const reason = String(body.reason || "").trim();
    if (!actions.has(action) || reason.length < 5) {
      return NextResponse.json(
        { message: "A valid action and reason are required" },
        { status: 400 }
      );
    }
    const account = await db.billingAccount.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { startDate: "desc" },
        },
      },
    });
    if (!account) return NextResponse.json({ message: "Billing account not found" }, { status: 404 });
    const current = account.subscriptions.find((subscription) =>
      ["ACTIVE", "TRIALING", "PAST_DUE", "NON_RENEWING"].includes(subscription.status)
    );
    let subscription;

    if (action === "CANCEL_END_PERIOD") {
      if (!current) {
        return NextResponse.json({ message: "No current subscription" }, { status: 409 });
      }
      subscription = await db.subscription.update({
        where: { id: current.id },
        data: { status: "NON_RENEWING", cancelledAt: new Date() },
        include: { plan: true },
      });
    } else {
      const requestedCode =
        action === "FALLBACK_FREE"
          ? defaultFreePlanCode(account.type === "FAMILY" ? "FAMILY" : "SCHOOL")
          : String(body.planCode || "").toUpperCase();
      const plan = await db.plan.findUnique({ where: { code: requestedCode } });
      if (!plan) return NextResponse.json({ message: "Plan not found" }, { status: 404 });
      const expectedAudience =
        account.type === "FAMILY"
          ? "FAMILY"
          : account.type === "SCHOOL"
            ? "SCHOOL"
            : "ENTERPRISE";
      if (
        plan.audience !== expectedAudience &&
        !(expectedAudience !== "FAMILY" && plan.audience === "ENTERPRISE")
      ) {
        return NextResponse.json({ message: "Plan audience does not match account" }, { status: 400 });
      }
      subscription = await db.$transaction(async (tx) => {
        await tx.subscription.updateMany({
          where: {
            billingAccountId: id,
            status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "NON_RENEWING"] },
          },
          data: { status: "EXPIRED", endDate: new Date() },
        });
        return tx.subscription.create({
          data: {
            billingAccountId: id,
            userId: account.userId,
            planId: plan.id,
            provider: "MANUAL",
            status: "ACTIVE",
            subscriptionPlan:
              plan.tier === "ENTERPRISE" ? "ENTERPRISE" : plan.tier === "PRO" ? "PRO" : "FREE",
            startDate: new Date(),
            ...(plan.tier !== "FREE"
              ? {
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                }
              : {}),
          },
          include: { plan: true },
        });
      });
    }
    await logSuperUserAction({
      superUserId: session.id,
      action: `SUBSCRIPTION_${action}`,
      targetId: `billing-account:${id}`,
      metadata: {
        reason,
        previousSubscriptionId: current?.id || null,
        subscriptionId: subscription.id,
        planCode: subscription.plan.code,
        provider: subscription.provider,
      },
    });
    return NextResponse.json({ message: "Subscription updated", subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update subscription";
    return NextResponse.json(
      { message },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "FORBIDDEN" || message === "INVALID_ORIGIN"
              ? 403
              : 400,
      }
    );
  }
}
