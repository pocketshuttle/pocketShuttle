import { NextRequest, NextResponse } from "next/server";

import { logSuperUserAction, requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

function parseFeatures(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export async function GET() {
  try {
    await requirePlatformAdmin();
    const plans = await db.plan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { price: "asc" },
    });
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePlatformAdmin();
    const body = await req.json();
    const plan = await db.plan.create({
      data: {
        name: String(body.name || "").trim(),
        price: Number(body.price || 0),
        duration: Number(body.duration || 30),
        description: body.description ? String(body.description) : null,
        features: parseFeatures(body.features),
        isActive: body.isActive !== false,
      },
    });

    await logSuperUserAction({
      superUserId: session.id,
      action: "PAYMENT_PLAN_CREATED",
      targetId: `plan:${plan.id}`,
      metadata: { name: plan.name },
    });

    return NextResponse.json({ message: "Plan created", plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}
