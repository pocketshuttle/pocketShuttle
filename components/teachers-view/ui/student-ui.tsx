import { StudentProps } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import avatar from "@/public/images/avatar.jpg";
import { AttendanceTab } from "./register-tab";
import { fetchCoordinates, getCurrentLocation, getGoogleMapsRoute, getRoute, googleFetchCoordinates } from "@/components/maps/lib/utils";
import { useRecoilValue } from "recoil";
import { studentETA } from "@/atoms/eta";

export const EachStudent = ({ student }: { student: StudentProps }) => {
    const [attendance, SetAttendance] = useState("");
    const [coords1, setCoords1] = useState<[number, number] | null>(null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const stdentEta = useRecoilValue(studentETA);

    console.log(stdentEta)


    // Fetch current location on mount
    // useEffect(() => {
    //     const fetchMyCoordinate = async () => {
    //         const [longitude, latitude] = await getCurrentLocation();
    //         setCoords1([longitude, latitude]);
    //     };
    //     fetchMyCoordinate();
    // }, []);

    // Fetch parent's coordinates when student data is available
    // useEffect(() => {
    //     const fetchParentCoordinates = async () => {
    //         try {
    //             if (student?.address) {
    //                 const coordinates2 = await googleFetchCoordinates(student.address);

    //                 // console.log("Coordinates for parent address:", coordinates2);
    //                 if (coordinates2) {
    //                     setCoords2(coordinates2);
    //                 } else {
    //                     console.error("Coordinates not found for the given address");
    //                 }
    //             }
    //         } catch (error) {
    //             console.error("Error fetching coordinates:", error);
    //         }
    //     };

    //     // Fetch coordinates when student's address is available
    //     fetchParentCoordinates();
    // }, [student?.address]);


    // Fetch route and calculate ETA only when both coordinates are available
    // useEffect(() => {
    //     const fetchRouteEta = async () => {
    //         console.log("Fetching route ETA");
    //         console.log(coords1, coords2);
    //         if (coords1 && coords2) {
    //             try {
    //                 // getCurrentLocation returns [lng, lat] format
    //                 // googleFetchCoordinates returns [lat, lng] format
    //                 const origin = { lat: coords1[1], lng: coords1[0] }; // [lng, lat] -> {lat, lng}
    //                 const destination = { lat: coords2[0], lng: coords2[1] }; // [lat, lng] -> {lat, lng}

    //                 console.log("Origin:", origin);
    //                 console.log("Destination:", destination);

    //                 const route = await getGoogleMapsRoute(origin, destination);
    //                 console.log("Route result:", route);

    //                 if (route && route.routes && route.routes.length > 0) {
    //                     const durationInSeconds = route.routes[0].legs[0].duration?.value;
    //                     console.log("Duration in seconds:", durationInSeconds);

    //                     if (durationInSeconds) {
    //                         // Calculate hours, minutes, and seconds from duration
    //                         const timeInHours = Math.floor(durationInSeconds / 3600);
    //                         const timeInMinutes = Math.floor((durationInSeconds % 3600) / 60);

    //                         // Format the time as HH:MM
    //                         const formattedEta = `${timeInHours}:${timeInMinutes < 10 ? "0" : ""}${timeInMinutes}am`;
    //                         setEta(formattedEta);
    //                         console.log("Formatted ETA:", formattedEta);
    //                     }
    //                 }
    //             } catch (error) {
    //                 console.error("Error fetching route ETA:", error);
    //             }
    //         }
    //     };
    //     fetchRouteEta();
    // }, [coords1, coords2]);



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
