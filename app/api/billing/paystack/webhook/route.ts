import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (secret) {
    const signature = req.headers.get("x-paystack-signature") || "";
    const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody || "{}");
  const reference = payload?.data?.reference;
  const status = payload?.event === "charge.success" ? "COMPLETED" : "FAILED";

  if (!reference) {
    return NextResponse.json({ received: true });
  }

  const payment = await db.knownDriverPayment.updateMany({
    where: { providerRef: reference },
    data: {
      status,
      paidAt: status === "COMPLETED" ? new Date() : null,
      metadata: payload,
    },
  });

  if (payment.count && status === "COMPLETED") {
    const storedPayment = await db.knownDriverPayment.findUnique({
      where: { providerRef: reference },
      select: { assignmentId: true },
    });

    if (storedPayment) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      await db.childDriverAssignment.update({
        where: { id: storedPayment.assignmentId },
        data: {
          billingStatus: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
