import { useEffect, useState, useCallback } from "react";
import Ably from "ably";

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
        // Update existing teacher's location
        const updated = [...prev];
        updated[index] = location;
        return updated;
      }
      // Add new teacher
      return [...prev, location];
    });
  }, []);

  useEffect(() => {
    const ably = new Ably.Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_KEY!,
    });

    const channel = ably.channels.get("live-school-channel");

    channel.subscribe("teacher-location-update", (message) => {
      updateTeacherLocation(message.data);
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [updateTeacherLocation]);

  return teachers;
};
