import { NextRequest, NextResponse } from "next/server";

import { logSuperUserAction, requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

type Params = { id: string };

function parseFeatures(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requirePlatformAdmin();
    const body = await req.json();
    const plan = await db.plan.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.duration !== undefined ? { duration: Number(body.duration) } : {}),
        ...(body.description !== undefined ? { description: body.description ? String(body.description) : null } : {}),
        ...(body.features !== undefined ? { features: parseFeatures(body.features) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });

    await logSuperUserAction({
      superUserId: session.id,
      action: "PAYMENT_PLAN_UPDATED",
      targetId: `plan:${plan.id}`,
      metadata: { name: plan.name, isActive: plan.isActive },
    });

    return NextResponse.json({ message: "Plan updated", plan });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}
