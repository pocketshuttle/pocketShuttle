import { StudentProps } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import avatar from "@/public/images/avatar.jpg";
import { AttendanceTab } from "./register-tab";
import { fetchCoordinates, getCurrentLocation, getETA, getRoute, googleFetchCoordinates } from "@/components/maps/lib/utils";
import { useAutoUpdateETA } from "@/hooks/use-student-eta";
import { useRecoilValue } from "recoil";
import { studentETA } from "@/atoms/eta";


export const EachStudent = ({ student }: { student: StudentProps }) => {
    const [attendance, SetAttendance] = useState("");
    const [coords1, setCoords1] = useState<[number, number] | null>(null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);

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

    console.log("Coords1:", coords1, "Coords2:", coords2);

    // useEffect(() => {
    //     const fetchETA = async () => {
    //         console.log("Fetch ETA with coords1:", coords1, "and coords2:", coords2);

    //         if (coords1 && coords2) {
    //             console.log("Fetching ETA with coords1:", coords1, "and coords2:", coords2);
    //             try {
    //                 const eta = await getETA(coords1, coords2);
    //                 console.log("ETA fetched:", eta);
    //             } catch (error) {
    //                 console.error("Error fetching ETA:", error);
    //             }
    //         }
    //     }

    //     fetchETA();

    //     //      const interval = setInterval(fetchETA, 10000);

    //     // return () => clearInterval(interval);
    // }, [student?.parent?.address, coords1, coords2]);
    useEffect(() => {
        if (!window.google) return;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [{ lat: 9.1716, lng: 7.3521 }], // coords
                destinations: [{ lat: 7.3670, lng: 9.1177 }],
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
                if (status === "OK") {
                    const element = response?.rows[0].elements[0];
                    console.log("Distance:", element?.distance.text);
                    console.log("Duration:", element?.duration.text);
                } else {
                    console.error("DistanceMatrix failed:", status);
                }
            }
        );
    }, []);

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
                {/* {!stdentEta ? (
                    <span>Please Enable Location</span>
                ) : (
                    <span className="text-[#B4B4B4]">
                        {stdentEta}
                    </span>
                )} */}
            </div>
        </div>
    );
};
