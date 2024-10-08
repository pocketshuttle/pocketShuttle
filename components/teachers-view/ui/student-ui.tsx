import { StudentProps } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import avatar from "@/public/images/avatar.jpg";
import { AttendanceTab } from "./register-tab";
import { fetchCoordinates, getCurrentLocation, getRoute } from "@/components/maps/lib/utils";

export const EachStudent = ({ student }: { student: StudentProps }) => {
    const [attendance, SetAttendance] = useState("");
    const [coords1, setCoords1] = useState<[number, number] | null>(null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const [eta, setEta] = useState<string | null>(null);

    // Fetch current location on mount
    useEffect(() => {
        const fetchMyCoordinate = async () => {
            const [longitude, latitude] = await getCurrentLocation();
            setCoords1([longitude, latitude]);
        };
        fetchMyCoordinate();
    }, []);

    // Fetch parent's coordinates when student data is available
    useEffect(() => {
        const fetchParentCoordinates = async () => {
            try {
                if (student?.address) { // Ensure the address exists before fetching
                    const coordinates2 = await fetchCoordinates(student.address);
                    if (coordinates2) {
                        setCoords2(coordinates2); // Only set if coordinates are valid
                    } else {
                        console.error("Coordinates not found for the given address");
                    }
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        };

        // Fetch coordinates when student's address is available
        fetchParentCoordinates();
    }, [student?.address]); // Depend only on the student's address



    console.log(coords2);


    // Fetch route and calculate ETA only when both coordinates are available
    useEffect(() => {
        const fetchRouteEta = async () => {
            if (coords1 && coords2) {
                const route = await getRoute(coords1, coords2);
                const durationInSeconds = route?.duration;
                if (durationInSeconds) {
                    // Calculate hours, minutes, and seconds from duration
                    const timeInHours = Math.floor(durationInSeconds / 3600);
                    const timeInMinutes = Math.floor((durationInSeconds % 3600) / 60);
                    const timeInSeconds = Math.floor(durationInSeconds % 60);

                    // Format the time as HH:MM
                    const formattedEta = `${timeInHours}:${timeInMinutes < 10 ? "0" : ""}${timeInMinutes}am`;
                    setEta(formattedEta);
                }
            }
        };
        fetchRouteEta();
    }, [coords1, coords2]);



    return (
        <div key={student.id} className="w-full bg-[#606060]/10">
            <div className="flex items-center py-2 px-4 space-x-4 rounded-md border-b-[1px] border-dashed border-[#2A2A2A]">
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
                {!eta ? (
                    <span>Please Enable Location</span>
                ) : (
                    <span className="text-[#B4B4B4]">{eta}</span>
                )}
            </div>
        </div>
    );
};
