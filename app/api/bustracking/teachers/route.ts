import { getPusherInstance } from "@/pusher/server";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextApiResponse) {
  try {
    const { latitude, longitude, teacherId, teacherImage, teacherName } =
      await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { message: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    console.log(longitude, "from teacher");
    // Save the location (you could remove this part if not saving to the database)
    // Get the Pusher instance
    const pusher = getPusherInstance();

    // Trigger the event to Pusher
    await pusher.trigger("live-teachers-channel", "teacher-location-update", {
      latitude,
      longitude,
      teacherId,
      teacherImage,
      teacherName,
    });

    // Respond to the client
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
