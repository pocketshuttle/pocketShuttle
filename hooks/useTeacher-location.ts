import { useEffect } from "react";
import Ably from "ably";

export const useTeacherLocation = (
  teacherId: string,
  onUpdate: (data: {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
  }) => void
) => {
  useEffect(() => {
    const ably = new Ably.Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_KEY!,
    });

    const channel = ably.channels.get(`teacher-location:${teacherId}`);

    // Subscribe to location updates
    channel.subscribe("location-update", (message) => {
      const { latitude, longitude, teacherName, teacherImage } = message.data;
      onUpdate({ teacherId, teacherName, teacherImage, latitude, longitude });
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [teacherId, onUpdate]);
};
