import Ably from "ably";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  teacherId: string;
  teacherImage: string;
  teacherName: string;
}

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

/**
 * Helper function to broadcast location update via Ably.
 * @param channel - Channel name to broadcast the message
 * @param data - The location update data to send
 */

async function broadcastLocationUpdate(
  channel: string,
  data: LocationUpdatePayload
) {
  const ablyChannel = ably.channels.get(channel);
  return ablyChannel.publish("teacher-location-update", data);
}

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude, teacherId, teacherImage, teacherName } =
      (await req.json()) as LocationUpdatePayload;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { message: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    const locationData: LocationUpdatePayload = {
      latitude,
      longitude,
      teacherId,
      teacherImage,
      teacherName,
    };

    //  Broadcast to the public "school-wide" channel
    await broadcastLocationUpdate("teacher-location-update", locationData);

    // Fetch teacher + students "on the way"
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
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

    // Broadcast to each parent's private channel
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
