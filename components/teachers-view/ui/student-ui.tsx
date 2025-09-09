import { StudentProps } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import avatar from "@/public/images/avatar.jpg";
import { AttendanceTab } from "./register-tab";
import { getCurrentLocation, googleFetchCoordinates } from "@/components/maps/lib/utils";

import { useTeacherLocation } from "@/hooks/useTeacher-location";
import { checkBusArrival } from "@/actions/report-folder/get-bus-arrival";


export const EachStudent = ({ student, teacherId }: { student: StudentProps, teacherId: string }) => {
    const [attendance, SetAttendance] = useState("");
    const [coords1, setCoords1] = useState<[number, number] | null>(null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const [stdentEta, setStudentEta] = useState<string | null>(null);
    const [teacherLocation, setTeacherLocation] = useState<
        Record<string, { teacherId: string; teacherName: string; teacherImage: string; latitude: number; longitude: number }>
    >({});
    const [tracking, setTracking] = useState(true);

    // useTeacherLocation(teacherId, setTeacherLocation);
    // useTeacherLocation(teacherId, (data) => {
    //     setTeacherLocation(prev => ({
    //         ...prev,
    //         [data.teacherId]: {
    //             teacherId: data.teacherId,
    //             teacherName: data.teacherName,
    //             teacherImage: data.teacherImage,
    //             latitude: data.latitude,
    //             longitude: data.longitude
    //         }
    //     }));
    // });

    // Fetch current location on mount

    useEffect(() => {
        if (!tracking) return;
        const intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition((pos) => {
                setCoords1([pos.coords.latitude, pos.coords.longitude])
            },
                (err) => console.error("Location erro", err),
                { enableHighAccuracy: true }
            )
        }, 20000)

        return () => clearInterval(intervalId);

    }, [tracking]);

    useEffect(() => {
        if (!coords2 || !tracking) return;
        (async () => {
            const result = await checkBusArrival(coords2, coords1, student, teacherId);
            console.log(result)
            if (result) {
                // 🚨 stop tracking this student
                setTracking(false);
            }
        })()
    }, [coords2, coords1, student, tracking]);

    // Fetch parent's coordinates when student data is available
    useEffect(() => {
        const fetchParentCoordinates = async () => {
            try {
                if (student?.parent?.address) {
                    const coordinates2 = await googleFetchCoordinates(student?.parent?.address || "");

                    if (coordinates2) {
                        setCoords2(coordinates2);
                    } else {
                        console.log("Coordinates not found for the given address");
                    }
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        };

        // Fetch coordinates when student's address is available
        fetchParentCoordinates();
    }, [student?.parent?.address]);

    useEffect(() => {
        if (!window.google) return;
        const teacher = teacherLocation[teacherId] || null;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                // origins: [{ lat: teacher?.latitude, lng: teacher?.longitude }] || [{ lat: "9.171772891650901"  lng: "7.352188010149178" }],
                origins: [{ lat: 9.171772891650901, lng: 7.352188010149178 }],
                destinations: coords2 ? [{ lat: coords2[0], lng: coords2[1] }] : [],
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
    }, [coords2]);


    return (
        <div key={student.id} className="w-full bg-[#606060]/10">
            <div className="flex items-center justify-center py-2 px-4 space-x-4 rounded-md border-b-[1px] border-dashed border-[#2A2A2A]">
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
                            onOTW={() => setTracking(true)}
                        />
                    </div>
                    <p className="text-sm text-[#606060] mb-4 capitalize">{student.address}</p>

                    <div className="flex space-x-3">
                        <AttendanceTab
                            label1="Present"
                            label2="Absent"
                            data={student.attendance ? student.attendance : "No attendance recorded"}
                            value1="PRESENT"
                            value2="ABSENT"
                            SetAttendance={SetAttendance}
                            attendance={attendance}
                            id={student.id}
                        />

                        {(student.attendance === "PRESENT" || student.presence === "ON_THE_WAY") && (
                            <AttendanceTab
                                label1="Dropped"
                                label2="Picked"
                                data={student.status}
                                value1="DROPPED"
                                value2="PICKED"
                                SetAttendance={SetAttendance}
                                attendance={attendance}
                                id={student.id}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="px-2 py-4 flex items-center justify-between capitalize">
                <span className="text-[#484848]">Pick up</span>
                {!stdentEta ? (
                    <span>Please Enable Location</span>
                ) : (
                    <span className="text-[#B4B4B4]">
                        {stdentEta}
                    </span>
                )}
            </div>
        </div>
    );
};




