import Ably from "ably";

const ably = new Ably.Realtime({
  key: process.env.NEXT_PUBLIC_ABLY_KEY!,
});

export const publishLocation = async (
  latitude: number,
  longitude: number,
  teacherId: string,
  teacherName: string,
  teacherImage: string
) => {
  try {
    const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_KEY!);
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
