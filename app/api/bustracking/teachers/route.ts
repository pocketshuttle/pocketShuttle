import Ably from "ably";
import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isTeacher } from "@/lib/api-auth";

interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  teacherId: string;
  teacherImage: string | null;
  teacherName: string | null;
}

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

async function broadcastLocationUpdate(
  channel: string,
  data: LocationUpdatePayload
) {
  const ablyChannel = ably.channels.get(channel);
  return ablyChannel.publish("live-school-channel", data);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!isTeacher(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude } = (await req.json()) as Partial<LocationUpdatePayload>;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { message: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    const teacherRecord = await db.teacher.findFirst({
      where: { id: session.id, schoolId },
      select: {
        id: true,
        full_name: true,
        image: true,
      },
    });

    if (!teacherRecord) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const locationData: LocationUpdatePayload = {
      latitude,
      longitude,
      teacherId: teacherRecord.id,
      teacherImage: teacherRecord.image,
      teacherName: teacherRecord.full_name,
    };

    const teacher = await db.teacher.findUnique({
      where: { id: teacherRecord.id },
      include: {
        bus: {
          include: {
            students: {
              where: { presence: "ON_THE_WAY" },
              include: { parent: true },
            },
          },
        },
      },
    });

    if (teacher?.bus?.students) {
      const parentChannels = teacher.bus.students
        .filter((student) => student.parent?.id)
        .map((student) => `parent-${student.parent!.id}`);

      await Promise.all(
        parentChannels.map((channel) =>
          broadcastLocationUpdate(channel, locationData)
        )
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
