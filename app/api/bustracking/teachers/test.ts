import db from "@/packages/db/client";
import { PUSHER_EVENTS } from "@/lib/pusher-constants";
import { getPusherInstance } from "@/pusher/server";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  teacherId: string;
  teacherImage: string;
  teacherName: string;
}

/**
 * Helper function to broadcast location update via Pusher.
 * This avoids repetition of the trigger logic for different channels.
 *
 * @param pusher - Pusher instance
 * @param channel - Channel name to broadcast the message
 * @param data - The location update data to send
 */

async function broadcastLocationUpdate(
  pusher: ReturnType<typeof getPusherInstance>,
  channel: string,
  data: LocationUpdatePayload
) {
  return pusher.trigger(channel, "teacher-location-update", data);
}

export async function POST(req: NextRequest, res: NextApiResponse) {
  try {
    // Parse and validate the request body
    const { latitude, longitude, teacherId, teacherImage, teacherName } =
      (await req.json()) as LocationUpdatePayload;

    // Ensure latitude and longitude are valid numbers
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { message: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    // Initialize Pusher instance for broadcasting events
    const pusher = getPusherInstance();

    // Prepare the data to be broadcasted to all channels
    const locationData = {
      latitude,
      longitude,
      teacherId,
      teacherImage,
      teacherName,
    };

    // Broadcast the teacher's location to a public channel
    await broadcastLocationUpdate(
      pusher,
      "teacher-location-update",
      locationData
    );

    // Fetch the teacher, their associated bus, and only students whose presence is "ON_THE_WAY"
    const teacher = await db.teacher.findUnique({
      where: {
        id: teacherId,
      },
      include: {
        bus: {
          include: {
            students: {
              where: {
                presence: "ON_THE_WAY", // Filter for students on the way
              },
              include: {
                parent: true, // Fetch parent details to send personalized updates
              },
            },
          },
        },
      },
    });

    console.log("Teacher with bus and students:", teacher);

    // If the teacher has a bus and students associated, notify each parent
    if (teacher?.bus?.students) {
      // Collect all parent-specific channels to broadcast the location update
      const parentChannels = teacher.bus.students
        .filter((student) => student.parent?.id) // Ensure the student has a valid parent
        .map((student) => `parent-${student.parent?.id}`);

      // Broadcast to each parent's channel
      await Promise.all(
        parentChannels.map((channel) =>
          broadcastLocationUpdate(pusher, channel, locationData)
        )
      );
    }

    // Respond to the client indicating a successful operation
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Log the error for debugging purposes in production
    console.error("Error processing request:", error);

    // Respond with an internal server error to the client
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
