import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getPusherInstance } from "@/pusher/server";
import { getApiSession, isTeacher } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!isTeacher(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude } = await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { message: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    const teacher = await db.teacher.findFirst({
      where: { id: session.id, schoolId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const pusher = getPusherInstance();

    await pusher.trigger("live-school-channel", "bus-location-update", {
      latitude,
      longitude,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
