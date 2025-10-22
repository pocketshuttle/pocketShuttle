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
    const [tracking, setTracking] = useState(student.presence === "ON_THE_WAY");
    const [arrivalLogged, setArrivalLogged] = useState(false);

    // useTeacherLocation(teacherId, setTeacherLocation);
    useTeacherLocation(teacherId, (data) => {
        setTeacherLocation(prev => ({
            ...prev,
            [data.teacherId]: {
                teacherId: data.teacherId,
                teacherName: data.teacherName,
                teacherImage: data.teacherImage,
                latitude: data.latitude,
                longitude: data.longitude
            }
        }));
    });

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

    // Auto-toggle tracking based on presence/status
    useEffect(() => {
        // Start tracking when teacher marks student ON_THE_WAY
        if (student.presence === "ON_THE_WAY") {
            setTracking(true);
            setArrivalLogged(false);

        }
        // Stop tracking when student is picked
        if (student.status === "PICKED") {
            setTracking(false);
        }
    }, [student.presence, student.status]);

    useEffect(() => {
        if (
            !coords1 ||
            !coords2 ||
            student.status === "PICKED" ||
            student.presence !== "ON_THE_WAY" ||
            !tracking ||
            arrivalLogged
        ) return;

        // console.log(coords1, coords2, student.status, student.presence, tracking, arrivalLogged, "coords1, coords2, student.status, student.presence, tracking, arrivalLogged")

        const check = async () => {
            const arrived = await checkBusArrival(coords1, coords2, student, teacherId);
            if (arrived) {
                // console.log(`Arrival logged for ${student.full_name}`);
                setArrivalLogged(true);
            }

            console.log(arrived, "arrived")
        };

        const interval = setInterval(check, 20_000);
        return () => clearInterval(interval);
    }, [coords1, coords2, student.status, student.presence, teacherId, tracking, arrivalLogged]);


    // Reset tracking each morning (optional, depends on your use case)
    useEffect(() => {
        const today = new Date().toDateString();
        const lastTracked = localStorage.getItem(`lastTracked-${student.id}`);

        if (lastTracked !== today) {
            // New day  reset status if needed

            // console.log(` Resetting tracking for ${student.full_name}`);
            localStorage.setItem(`lastTracked-${student.id}`, today);
            setArrivalLogged(false); // Reset arrival logged state for new day
        }
    }, [student.id]);

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


    //REDUCE THE API CALLS
    useEffect(() => {
        if (!window.google) return;
        const teacher = teacherLocation[teacherId] || null;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [{ lat: teacher?.latitude, lng: teacher?.longitude }],
                // origins: [{ lat: 9.171772891650901, lng: 7.352188010149178 }],
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
    }, [coords2, coords1]);


    return (
        <div
            key={student.id}
            className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 transition hover:shadow-md"
        >
            {/* Header Section */}
            <div className="flex items-center gap-4 p-4 border-b border-dashed border-gray-200">
                <Link href={`teacher/${student.id}`}>
                    <Image
                        src={student.image || avatar}
                        alt={student.full_name}
                        className="rounded-xl object-cover w-20 h-20 shadow-sm"
                        width={100}
                        height={100}
                    />
                </Link>

                <div className="flex-1">
                    {/* Name + Attendance Toggle */}
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 capitalize">
                                {student.full_name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {student.age} yrs • {student.grade}
                            </p>
                        </div>

                        <AttendanceTab
                            label1="OTW"
                            label2="Stop"
                            data={student.presence || "No presence recorded"}
                            value1="ON_THE_WAY"
                            value2="NONE"
                            SetAttendance={SetAttendance}
                            attendance={attendance}
                            id={student.id}
                            eta={stdentEta}
                            onOTW={() => setTracking(true)}
                        />
                    </div>

                    {/* Address */}
                    <p className="text-sm text-gray-600 leading-snug capitalize truncate max-w-[250px]">
                        {student.address}
                    </p>
                </div>
            </div>

            {/* Attendance Controls */}
            <div className="flex gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/40">
                <AttendanceTab
                    label1="Present"
                    label2="Absent"
                    data={student.attendance || "No attendance recorded"}
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

            {/* Footer - Pickup Info */}
            <div className="flex items-center justify-between px-4 py-3 text-sm bg-gray-50 capitalize">
                <span className="text-gray-700 font-medium">Pick up</span>
                {!stdentEta ? (
                    <span className="text-red-400">Please enable location</span>
                ) : (
                    <span className="text-gray-500">{stdentEta}</span>
                )}
            </div>
        </div>

    );
};




