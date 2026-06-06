import { useEffect, useRef } from "react";
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
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!teacherId) return;

    const ably = getAblyClient();
    const channel = ably.channels.get(`teacher-location:${teacherId}`);

    const handleLocationUpdate = (message: any) => {
      const { latitude, longitude, teacherName, teacherImage } = message.data;
      onUpdateRef.current({ teacherId, teacherName, teacherImage, latitude, longitude });
    };

    channel.subscribe("location-update", handleLocationUpdate);

    return () => {
      channel.unsubscribe("location-update", handleLocationUpdate);
      // ably.close();
    };
  }, [teacherId]);
};
