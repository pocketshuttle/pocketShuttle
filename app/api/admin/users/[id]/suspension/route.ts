import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { parseUserKey, requirePlatformPermission, setSuspension } from "@/lib/admin/platform";

type Params = { id: string };

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    assertSameOrigin(req);
    const session = await requirePlatformPermission("accounts.suspend");
    const { id } = await params;
    const parsed = parseUserKey(decodeURIComponent(id));
    if (!parsed) {
      return NextResponse.json({ message: "Invalid user key" }, { status: 400 });
    }
    if (parsed.type === "superadmin") {
      return NextResponse.json({ message: "Super admins cannot be suspended here" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();
    if (!["suspend", "unsuspend"].includes(action)) {
      return NextResponse.json({ message: "Invalid suspension action" }, { status: 400 });
    }

    await setSuspension({
      actorId: session.id,
      type: parsed.type,
      id: parsed.id,
      suspend: action === "suspend",
      reason: body.reason,
    });

    return NextResponse.json({
      message: action === "suspend" ? "Account suspended" : "Account unsuspended",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message !== "UNAUTHORIZED" ? 400 : 401 }
    );
  }
}
