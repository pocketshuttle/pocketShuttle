import { StudentProps } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import avatar from "@/public/images/avatar.jpg";
import { googleFetchCoordinates } from "@/components/maps/lib/utils";
import { StudentPresence } from "@/components/students/ui/presence";
import { AttendanceTab } from "./register-tab";
import { checkBusArrival } from "@/actions/report-folder/get-bus-arrival";

type TeacherStudent = {
    id: string;
    full_name: string | null;
    image: string | null;
    address: string | null;
    age: number | null;
    grade: string | null;
    attendance: StudentProps["attendance"];
    status: string | null;
    presence: string | null;
    parent?: {
        address: string | null;
    } | null;
};

export const EachStudent = ({
    student,
    teacherId,
}: {
    student: TeacherStudent;
    teacherId: string;
}) => {
    const [attendance, SetAttendance] = useState("");
    const [coords1, setCoords1] = useState<[number, number] | null>(null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const [stdentEta, setStudentEta] = useState<string | null>(null);
    const [tracking, setTracking] = useState(student.presence === "ON_THE_WAY");
    const [arrivalLogged, setArrivalLogged] = useState(false);
    const canSendOtw = student.attendance === "PRESENT";

    useEffect(() => {
        if (!tracking) return;

        const updateCurrentPosition = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords1([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => console.error("Location erro", err),
                { enableHighAccuracy: true }
            );
        };

        updateCurrentPosition();
        const intervalId = setInterval(updateCurrentPosition, 20_000);

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
            const arrived = await checkBusArrival(coords1, coords2, student as StudentProps, teacherId);
            if (arrived) {
                setArrivalLogged(true);
            }
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
                    }
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        };

        fetchParentCoordinates();
    }, [student?.parent?.address]);

    useEffect(() => {
        if (!window.google || !coords1 || !coords2) return;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [{ lat: coords1[0], lng: coords1[1] }],
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
    }, [coords1, coords2]);

    return (
        <div
            key={student.id}
            className="mx-auto mb-4 w-full max-w-2xl overflow-hidden rounded-[26px] border border-black/10 bg-white text-black shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-colors dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:shadow-none"
        >
            <div className="border-b border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 dark:border-white/10 dark:bg-none dark:bg-white/[0.03]">
                <div className="flex items-start gap-3">
                    <Link href={`teacher/${student.id}`} className="shrink-0">
                        <Image
                            src={student.image || avatar}
                            alt={student.full_name || "Student"}
                            className="h-20 w-20 rounded-2xl object-cover ring-1 ring-black/10 dark:ring-white/10"
                            width={100}
                            height={100}
                        />
                    </Link>

                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-lg font-semibold capitalize tracking-tight text-black dark:text-white">
                                        {student.full_name || "Unnamed student"}
                                    </h2>
                                    <StudentPresence data={student.presence || "NONE"} />
                                </div>
                                <p className="text-sm text-black/55 dark:text-white/55">
                                    {student.age ?? "N/A"} yrs • {student.grade || "N/A"}
                                </p>
                            </div>

                            <div className="shrink-0">
                                {canSendOtw ? (
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
                                ) : (
                                    <div className="flex h-9 items-center rounded-xl border border-black/10 bg-black/[0.03] px-3 text-[0.7rem] font-medium text-black/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40">
                                        OTW unavailable
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="truncate text-sm capitalize leading-snug text-black/60 dark:text-white/60">
                            {student.address || "No address"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-black/20 dark:shadow-none">
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

                    <div className="rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-black/20 dark:shadow-none">
                        {student.attendance === "PRESENT" || student.presence === "ON_THE_WAY" ? (
                            <AttendanceTab
                                label1="Dropped"
                                label2="Picked"
                                data={student.status || "No status recorded"}
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

                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-black/20 dark:shadow-none">
                    <div className="flex items-center justify-between gap-4">
                        <span className="truncate text-sm font-medium capitalize text-black/70 dark:text-white/70">
                            {student.status || "No status recorded"}
                        </span>
                        {!stdentEta ? (
                            <span className="truncate text-sm text-rose-400">Please enable location</span>
                        ) : (
                            <span className="truncate text-sm text-black/55 dark:text-white/55">{stdentEta}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
