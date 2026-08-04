import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { planCodeToLegacyTier } from "@/lib/billing/accounts";
import { PlanCode } from "@/lib/billing/catalog";
import { paystackEnvironmentFromSecret } from "@/lib/billing/provider-environment";
import { notifyBillingOwner } from "@/lib/billing/owner-notifications";
import db from "@/packages/db/client";

function addMonth(date: Date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
}

function asDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function providerSubscriptionCode(data: any) {
  return (
    data?.subscription?.subscription_code ||
    data?.subscription_code ||
    data?.subscription?.code ||
    null
  );
}

async function processKnownDriverCharge(payload: any) {
  if (payload?.event !== "charge.success") return false;
  const reference = payload?.data?.reference;
  if (typeof reference !== "string" || !reference.startsWith("kd_")) return false;

  const payment = await db.knownDriverPayment.findUnique({
    where: { providerRef: reference },
    select: { id: true, assignmentId: true },
  });
  if (!payment) return true;

  const now = new Date();
  await db.$transaction([
    db.knownDriverPayment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        paidAt: now,
        metadata: payload as Prisma.InputJsonValue,
      },
    }),
    db.childDriverAssignment.update({
      where: { id: payment.assignmentId },
      data: {
        billingStatus: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: addMonth(now),
      },
    }),
  ]);
  return true;
}

async function processPlatformCharge(payload: any) {
  if (payload?.event !== "charge.success") return false;
  const data = payload?.data;
  const reference = data?.reference;
  if (typeof reference !== "string" || !reference.startsWith("ps_sub_")) {
    return false;
  }

  const attempt = await db.billingPaymentAttempt.findUnique({
    where: { providerReference: reference },
    include: {
      planPrice: { include: { plan: true } },
    },
  });
  if (!attempt?.planPrice) return true;

  const now = new Date();
  const nextPaymentAt =
    asDate(data?.subscription?.next_payment_date) ??
    asDate(data?.next_payment_date) ??
    addMonth(now);
  const subscriptionCode = providerSubscriptionCode(data);
  const emailToken = data?.subscription?.email_token ?? null;
  const customerCode = data?.customer?.customer_code ?? null;

  const subscription =
    (attempt.subscriptionId
      ? await db.subscription.findUnique({ where: { id: attempt.subscriptionId } })
      : null) ??
    (subscriptionCode
      ? await db.subscription.findUnique({
          where: { providerSubscriptionCode: subscriptionCode },
        })
      : null);

  const subscriptionData = {
    billingAccountId: attempt.billingAccountId,
    planId: attempt.planPrice.planId,
    planPriceId: attempt.planPrice.id,
    subscriptionPlan: planCodeToLegacyTier(attempt.planPrice.plan.code as PlanCode),
    provider: "PAYSTACK" as const,
    providerEnvironment: attempt.providerEnvironment,
    status: "ACTIVE" as const,
    currentPeriodStart: now,
    currentPeriodEnd: nextPaymentAt,
    endDate: nextPaymentAt,
    graceEndsAt: null,
    providerSubscriptionCode: subscriptionCode,
    providerEmailToken: emailToken,
    providerNextPaymentAt: nextPaymentAt,
  };

  const saved = subscription
    ? await db.subscription.update({
        where: { id: subscription.id },
        data: subscriptionData,
      })
    : await db.subscription.create({ data: subscriptionData });

  await db.$transaction([
    db.billingPaymentAttempt.update({
      where: { id: attempt.id },
      data: {
        subscriptionId: saved.id,
        status: "SUCCEEDED",
        paidAt: now,
        metadata: payload as Prisma.InputJsonValue,
      },
    }),
    db.billingAccount.update({
      where: { id: attempt.billingAccountId },
      data: {
        ...(customerCode ? { providerCustomerCode: customerCode } : {}),
      },
    }),
  ]);
  return true;
}

async function processSubscriptionCreated(payload: any) {
  if (payload?.event !== "subscription.create") return false;
  const data = payload?.data;
  const code = providerSubscriptionCode(data);
  const paystackPlanCode = data?.plan?.plan_code;
  const customerCode = data?.customer?.customer_code;
  if (!code || !paystackPlanCode) return true;

  const providerPlan = await db.billingProviderPlan.findUnique({
    where: { providerPlanCode: paystackPlanCode },
    include: { planPrice: true },
  });
  const account = customerCode
    ? await db.billingAccount.findFirst({
        where: { providerCustomerCode: customerCode },
      })
    : null;
  if (!providerPlan || !account) return true;
  const price = providerPlan.planPrice;

  const currentPeriodEnd = asDate(data?.next_payment_date);
  const subscription = await db.subscription.findFirst({
    where: {
      billingAccountId: account.id,
      planPriceId: price.id,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
    },
    orderBy: { startDate: "desc" },
  });
  if (!subscription) return true;

  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      providerSubscriptionCode: code,
      providerEnvironment: providerPlan.environment,
      providerEmailToken: data?.email_token ?? null,
      providerNextPaymentAt: currentPeriodEnd,
      ...(currentPeriodEnd
        ? { currentPeriodEnd, endDate: currentPeriodEnd }
        : {}),
    },
  });
  return true;
}

async function processSubscriptionLifecycle(payload: any) {
  const event = payload?.event;
  if (
    ![
      "invoice.payment_failed",
      "invoice.update",
      "subscription.not_renew",
      "subscription.disable",
    ].includes(event)
  ) {
    return false;
  }

  const code = providerSubscriptionCode(payload?.data);
  if (!code) return true;
  const subscription = await db.subscription.findUnique({
    where: { providerSubscriptionCode: code },
  });
  if (!subscription) return true;

  if (event === "invoice.payment_failed") {
    const graceEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await db.subscription.update({
      where: { id: subscription.id },
      data: { status: "PAST_DUE", graceEndsAt },
    });
    await notifyBillingOwner({
      billingAccountId: subscription.billingAccountId,
      eventType: "subscription_payment_failed",
      message:
        "Your PocketShuttle renewal failed. Pro access will remain available for three days while you update payment details.",
    });
    return true;
  }

  if (event === "invoice.update") {
    const paid =
      payload?.data?.paid === true ||
      payload?.data?.status === "success" ||
      payload?.data?.transaction?.status === "success";
    if (!paid) return true;
    const nextPaymentAt =
      asDate(payload?.data?.subscription?.next_payment_date) ??
      asDate(payload?.data?.next_payment_date) ??
      addMonth(new Date());
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        graceEndsAt: null,
        currentPeriodEnd: nextPaymentAt,
        endDate: nextPaymentAt,
        providerNextPaymentAt: nextPaymentAt,
      },
    });
    await notifyBillingOwner({
      billingAccountId: subscription.billingAccountId,
      eventType: "subscription_payment_recovered",
      message: "Your PocketShuttle subscription payment was received and Pro access is active.",
    });
    return true;
  }

  const hasRemainingAccess =
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() > Date.now();
  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      status: hasRemainingAccess ? "NON_RENEWING" : "CANCELLED",
      cancelledAt: subscription.cancelledAt ?? new Date(),
    },
  });
  return true;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const environment = paystackEnvironmentFromSecret(secret);

  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "Paystack webhook secret is not configured" },
      { status: 503 }
    );
  }
  if (secret) {
    const signature = req.headers.get("x-paystack-signature") || "";
    const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    const valid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const fingerprint = crypto.createHash("sha256").update(rawBody).digest("hex");
  try {
    await db.billingWebhookReceipt.create({
      data: {
        fingerprint,
        eventType: String(payload?.event || "unknown"),
        providerEnvironment: environment ?? "TEST",
        payload: payload as Prisma.InputJsonValue,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  try {
    await processKnownDriverCharge(payload);
    await processPlatformCharge(payload);
    await processSubscriptionCreated(payload);
    await processSubscriptionLifecycle(payload);
    return NextResponse.json({ received: true });
  } catch (error) {
    await db.billingWebhookReceipt.delete({ where: { fingerprint } }).catch(() => undefined);
    console.error("Paystack webhook processing failed", error);
    return NextResponse.json({ message: "Webhook processing failed" }, { status: 500 });
  }
}
