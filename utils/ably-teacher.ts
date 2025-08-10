import { getAblyClient } from "@/ably/ably-client";

/**
 * Publishes a teacher's location to Ably.
 * @param latitude - The latitude of the teacher's location.
 * @param longitude - The longitude of the teacher's location.
 * @param teacherId - The ID of the teacher.
 * @param teacherName - The name of the teacher.
 * @param teacherImage - The image URL of the teacher.
 */
export const publishLocation = async (
  latitude: number,
  longitude: number,
  teacherId: string,
  teacherName: string,
  teacherImage: string
) => {
  try {
    // const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_KEY!);
    const ably = getAblyClient();

    const channel = ably.channels.get(`teacher-location:${teacherId}`);

    await channel.publish("location-update", {
      latitude,
      longitude,
      teacherId,
      teacherName,
      teacherImage,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error publishing to Ably:", error);
    throw error;
  }
};
