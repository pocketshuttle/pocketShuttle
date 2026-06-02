import { StudentProps } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import avatar from "@/public/images/avatar.jpg";
import { googleFetchCoordinates } from "@/components/maps/lib/utils";
import { StudentPresence } from "@/components/students/ui/presence";
import { AttendanceTab } from "./register-tab";
import { useTeacherLocation } from "@/hooks/useTeacher-location";
import { checkBusArrival } from "@/actions/report-folder/get-bus-arrival";

export const EachStudent = ({
    student,
    teacherId,
}: {
    student: StudentProps;
    teacherId: string;
}) => {
    const [attendance, SetAttendance] = useState("");
    const [coords1, setCoords1] = useState<[number, number] | null>(null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const [stdentEta, setStudentEta] = useState<string | null>(null);
    const [teacherLocation, setTeacherLocation] = useState<
        Record<
            string,
            {
                teacherId: string;
                teacherName: string;
                teacherImage: string;
                latitude: number;
                longitude: number;
            }
        >
    >({});
    const [tracking, setTracking] = useState(student.presence === "ON_THE_WAY");
    const [arrivalLogged, setArrivalLogged] = useState(false);

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

    useEffect(() => {
        if (!tracking) return;
        const intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords1([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => console.error("Location erro", err),
                { enableHighAccuracy: true }
            );
        }, 20000);

        return () => clearInterval(intervalId);
    }, [tracking]);

    useEffect(() => {
        if (student.presence === "ON_THE_WAY") {
            setTracking(true);
            setArrivalLogged(false);
        }

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
        )
            return;

        const check = async () => {
            const arrived = await checkBusArrival(coords1, coords2, student, teacherId);
            if (arrived) {
                setArrivalLogged(true);
            }

            console.log(arrived, "arrived");
        };

        const interval = setInterval(check, 20_000);
        return () => clearInterval(interval);
    }, [coords1, coords2, student.status, student.presence, teacherId, tracking, arrivalLogged]);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastTracked = localStorage.getItem(`lastTracked-${student.id}`);

        if (lastTracked !== today) {
            localStorage.setItem(`lastTracked-${student.id}`, today);
            setArrivalLogged(false);
        }
    }, [student.id]);

    useEffect(() => {
        const fetchParentCoordinates = async () => {
            try {
                if (student?.parent?.address) {
                    const coordinates2 = await googleFetchCoordinates(student.parent.address || "");

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

        fetchParentCoordinates();
    }, [student?.parent?.address]);

    useEffect(() => {
        if (!window.google) return;
        const teacher = teacherLocation[teacherId] || null;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [{ lat: teacher?.latitude, lng: teacher?.longitude }],
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
    }, [coords2, coords1, teacherId, teacherLocation]);

    return (
        <div
            key={student.id}
            className="mx-auto mb-4 w-full max-w-2xl overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
        >
            <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                <div className="flex items-start gap-3">
                    <Link href={`teacher/${student.id}`} className="shrink-0">
                        <Image
                            src={student.image || avatar}
                            alt={student.full_name}
                            className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200"
                            width={100}
                            height={100}
                        />
                    </Link>

                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-lg font-semibold capitalize tracking-tight text-slate-900">
                                        {student.full_name}
                                    </h2>
                                    <StudentPresence data={student.presence || "NONE"} />
                                </div>
                                <p className="text-sm text-slate-500">
                                    {student.age} yrs • {student.grade}
                                </p>
                            </div>

                            <div className="shrink-0">
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
                        </div>

                        <p className="truncate text-sm capitalize leading-snug text-slate-600">
                            {student.address}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 bg-slate-50/80 p-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
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
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
                        {student.attendance === "PRESENT" || student.presence === "ON_THE_WAY" ? (
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
                        ) : (
                            <div className="h-9" />
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <span className="truncate text-sm font-medium capitalize text-slate-700">
                            {student.status}
                        </span>
                        {!stdentEta ? (
                            <span className="truncate text-sm text-rose-400">Please enable location</span>
                        ) : (
                            <span className="truncate text-sm text-slate-500">{stdentEta}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
