import { NextResponse } from "next/server";

import { parseUserKey, requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

type Params = { id: string };

export async function GET(_req: Request, { params }: { params: Params }) {
  try {
    await requirePlatformAdmin();
    const parsed = parseUserKey(decodeURIComponent(params.id));
    if (!parsed) {
      return NextResponse.json({ message: "Invalid user key" }, { status: 400 });
    }

    if (parsed.type === "school") {
      const user = await db.user.findUnique({
        where: { id: parsed.id },
        include: {
          Subscription: { include: { plan: true, Payment: true }, orderBy: { startDate: "desc" } },
          SchoolSettings: true,
          Teacher: { select: { id: true, full_name: true, email: true, phoneNumber: true, suspendedAt: true } },
          Driver: { select: { id: true, full_name: true, email: true, phoneNumber: true, suspendedAt: true } },
          Parent: { select: { id: true, full_name: true, email: true, phoneNumber: true, suspendedAt: true } },
          Student: { select: { id: true, full_name: true, grade: true, status: true, image: true } },
          Buses: { select: { id: true, bus_number: true, bus_product_name: true, color: true } },
        },
      });
      return NextResponse.json({ type: parsed.type, user });
    }

    if (parsed.type === "parent") {
      const user = await db.parent.findUnique({
        where: { id: parsed.id },
        include: {
          school: { select: { id: true, name: true, email: true } },
          Student: true,
          ParentChild: { include: { activeDriver: true, DriverRequest: true } },
          DriverRequest: { include: { driver: true, child: true } },
        },
      });
      return NextResponse.json({ type: parsed.type, user });
    }

    if (parsed.type === "driver") {
      const user = await db.driver.findUnique({
        where: { id: parsed.id },
        include: {
          school: { select: { id: true, name: true, email: true } },
          bus: true,
          ParentChild: true,
          DriverRequest: { include: { parent: true, child: true } },
        },
      });
      return NextResponse.json({ type: parsed.type, user });
    }

    if (parsed.type === "teacher") {
      const user = await db.teacher.findUnique({
        where: { id: parsed.id },
        include: {
          school: { select: { id: true, name: true, email: true } },
          bus: true,
          Student: true,
        },
      });
      return NextResponse.json({ type: parsed.type, user });
    }

    const user = await db.superUser.findUnique({
      where: { id: parsed.id },
      include: { actions: { orderBy: { createdAt: "desc" }, take: 25 } },
    });
    return NextResponse.json({ type: parsed.type, user });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
