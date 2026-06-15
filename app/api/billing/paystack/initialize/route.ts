import { NextRequest, NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import { KNOWN_DRIVER_MONTHLY_AMOUNT } from "@/lib/known-driver-network";
import db from "@/packages/db/client";

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const assignmentId = String(body.assignmentId || "");

  const assignment = await db.childDriverAssignment.findFirst({
    where: {
      id: assignmentId,
      parentId: session.id,
      status: "ACTIVE",
    },
    include: {
      parent: { select: { email: true } },
      child: { select: { fullName: true } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  const amount = assignment.monthlyAmount || KNOWN_DRIVER_MONTHLY_AMOUNT;
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { message: "Monthly child billing amount is not configured" },
      { status: 400 }
    );
  }

  const reference = `kd_${assignment.id}_${Date.now()}`;
  let authorizationUrl: string | null = null;

  if (process.env.PAYSTACK_SECRET_KEY && assignment.parent.email) {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: assignment.parent.email,
        amount: Math.round(amount * 100),
        currency: assignment.currency,
        reference,
        metadata: {
          assignmentId: assignment.id,
          parentId: assignment.parentId,
          childId: assignment.childId,
          childName: assignment.child.fullName,
          product: "known_driver_monthly_child",
        },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || "Unable to initialize Paystack payment" },
        { status: 502 }
      );
    }
    authorizationUrl = data?.data?.authorization_url || null;
  }

  const payment = await db.knownDriverPayment.create({
    data: {
      parentId: assignment.parentId,
      assignmentId: assignment.id,
      amount,
      currency: assignment.currency,
      providerRef: reference,
      authorizationUrl,
      metadata: {
        initializedWithoutProvider: !authorizationUrl,
      },
    },
  });

  return NextResponse.json({
    message: authorizationUrl ? "Payment initialized" : "Payment record created",
    payment,
  });
}
