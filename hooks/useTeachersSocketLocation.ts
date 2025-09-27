import { connectSocket } from "@/utils/socket-client";
import { useEffect, useState, useCallback } from "react";

interface TeacherLocation {
  teacherId: string;
  teacherName?: string;
  teacherImage?: string;
  latitude: number;
  longitude: number;
  timestamp?: number;
}
interface TeacherLocationInterface {
  newLocation: TeacherLocation;
}

export const useSchoolTeachersLocations = (schoolId?: string) => {
  const [teachersLocation, setTeachersLocation] = useState<TeacherLocation[]>(
    []
  );

  const updateTeacherLocation = useCallback((location: TeacherLocation) => {
    setTeachersLocation((prev) => {
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
    if (!schoolId) return;

    let socket: any;

    const connectToSchool = async () => {
      try {
        socket = await connectSocket("", schoolId);

        // Wait for connection or timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Socket connection timeout"));
          }, 10000);

          socket.on("connect", () => {
            clearTimeout(timeout);
            console.log("School socket connected!", socket.id);

            socket.emit("subscribe-school", { schoolId });
            resolve(true);
          });

          socket.on("connect_error", (error: any) => {
            clearTimeout(timeout);
            reject(error);
          });
        });

        // Listen for updates from teachers in this school
        socket.on(
          "teacher-location-update",
          (location: TeacherLocationInterface) => {
            console.log("📍 Location update received at school:", location);
            const loc = location.newLocation
              ? location.newLocation
              : location;
            updateTeacherLocation(loc);
          }
        );

        socket.on("disconnect", (reason: string) => {
          console.log("🔌 School socket disconnected:", reason);
        });
      } catch (error) {
        console.error(" Failed to connect school socket:", error);
      }
    };

    connectToSchool();

    return () => {
      if (socket) {
        socket.disconnect();
        console.log(" School socket cleaned up");
      }
    };
  }, [schoolId, updateTeacherLocation]);

  return teachersLocation;
};
