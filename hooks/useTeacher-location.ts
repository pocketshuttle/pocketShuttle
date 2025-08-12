import { useEffect } from "react";
import Ably from "ably";
import { getAblyClient } from "@/ably/ably-client";

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
    const ably = getAblyClient();
    const channel = ably.channels.get(`teacher-location:${teacherId}`);

    channel.subscribe("location-update", (message) => {
      const { latitude, longitude, teacherName, teacherImage } = message.data;
      onUpdate({ teacherId, teacherName, teacherImage, latitude, longitude });
    });

    return () => {
      channel.unsubscribe();
      // ably.close();
    };
  }, [teacherId, onUpdate]);
};
