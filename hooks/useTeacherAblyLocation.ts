// hooks/useSchoolTeacherLocations.ts
import { getAblyClient } from "@/ably/ably-client";
import { useEffect, useState, useCallback } from "react";

interface TeacherLocation {
  teacherId: string;
  teacherName: string;
  teacherImage: string;
  latitude: number;
  longitude: number;
}

export const useSchoolTeacherLocations = () => {
  const [teachers, setTeachers] = useState<TeacherLocation[]>([]);

  const updateTeacherLocation = useCallback((location: TeacherLocation) => {
    setTeachers((prev) => {
      const index = prev.findIndex((t) => t.teacherId === location.teacherId);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = location;
        return updated;
      }
      return [...prev, location];
    });
  }, []);

  useEffect(() => {
    const ably = getAblyClient();
    const channel = ably.channels.get("teacher-location-update");

    const listener = (message: any) => {
      updateTeacherLocation(message.data);
    };

    channel.subscribe("live-school-channel", listener);

    return () => {
      channel.unsubscribe("live-school-channel", listener);
    };
  }, [updateTeacherLocation]);

  return teachers;
};
