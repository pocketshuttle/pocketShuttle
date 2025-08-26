"use client";

import { StudentProps } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import avatar from "@/public/images/avatar.jpg";
import { AttendanceTab } from "./register-tab";
import { googleFetchCoordinates } from "@/components/maps/lib/utils";
import { useTeacherLocation } from "@/hooks/useTeacher-location";
import { useJsApiLoader } from "@react-google-maps/api";

export const EachStudent = ({ student, teacherId }: { student: StudentProps; teacherId: string }) => {
    const [attendance, SetAttendance] = useState("");
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const [stdentEta, setStudentEta] = useState<string | null>(null);
    const [teacherLocation, setTeacherLocation] = useState<
        Record<string, { teacherId: string; teacherName: string; teacherImage: string; latitude: number; longitude: number }>
    >({});

    // 🔥 live teacher location updates
    useTeacherLocation(teacherId, (data) => {
        setTeacherLocation((prev) => ({
            ...prev,
            [data.teacherId]: {
                teacherId: data.teacherId,
                teacherName: data.teacherName,
                teacherImage: data.teacherImage,
                latitude: data.latitude,
                longitude: data.longitude,
            },
        }));
    });

    // load Google Maps SDK
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ["places"],
    });

    // fetch parent's address → coordinates
    useEffect(() => {
        const fetchParentCoordinates = async () => {
            try {
                if (student?.parent?.address) {
                    const coordinates2 = await googleFetchCoordinates(student.parent.address);
                    if (coordinates2) setCoords2(coordinates2);
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        };
        fetchParentCoordinates();
    }, [student?.parent?.address]);

    // recalc ETA when teacher moves OR coords2 is ready
    useEffect(() => {
        if (!isLoaded || !coords2) return;

        const teacher = teacherLocation[teacherId];
        if (!teacher) return;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [{ lat: teacher.latitude, lng: teacher.longitude }],
                destinations: [{ lat: coords2[0], lng: coords2[1] }],
                travelMode: google.maps.TravelMode.DRIVING,
                region: "NG",
            },
            (response, status) => {
                if (status === "OK") {
                    const element = response?.rows[0].elements[0];
                    setStudentEta(element?.duration?.text || "Calculating...");
                } else {
                    console.error("DistanceMatrix failed:", status);
                }
            }
        );
    }, [isLoaded, coords2, teacherLocation, teacherId]); // 👈 now depends on teacherLocation too

    return (
        <div key={student.id} className="w-full bg-[#606060]/10">
            {/* Student profile row */}
            <div className="flex items-center justify-center py-2 px-4 space-x-4 rounded-md border-b border-dashed border-[#2A2A2A]">
                <Link href={`teacher/${student.id}`}>
                    <Image
                        src={student.image || avatar}
                        alt={student.full_name}
                        className="rounded-md object-cover w-24 h-24"
                        width={100}
                        height={100}
                    />
                </Link>

                <div className="mb-4 w-full">
                    <div className="flex justify-between items-center space-x-4">
                        <h2 className="space-x-2 capitalize text-lg">
                            {student.full_name}
                            <small className="ml-2 text-[#606060] text-xs">{student.age}</small>
                            <small className="text-[#606060] text-sx">{student.grade}</small>
                        </h2>
                        <AttendanceTab
                            label1="OTW"
                            label2="Stop"
                            data={student.presence ? student.presence : "No presence recorded"}
                            value1="ON_THE_WAY"
                            value2="NONE"
                            SetAttendance={SetAttendance}
                            attendance={attendance}
                            id={student.id}
                            eta={stdentEta}
                        />
                    </div>
                    <p className="text-sm text-[#606060] mb-4 capitalize">{student.address}</p>
                </div>
            </div>

            {/* ETA row */}
            <div className="px-2 py-4 flex items-center justify-between capitalize">
                <span className="text-[#484848]">Pick up</span>
                {!stdentEta ? <span>Please Enable Location</span> : <span className="text-[#B4B4B4]">{stdentEta}</span>}
            </div>
        </div>
    );
};
