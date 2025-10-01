"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import ParentViewData from "./parentdata";
import { TeacherLocationTracker } from "../maps/Map/teachersLocation/teacher-parent-map";
import { connectSocket } from "@/utils/socket-client";

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};
export default function NewParentPage({
    parentAddress,
    parentId,
    selectedTeacherId,
    siblings,
}: any) {
    const [teacherLocation, setTeacherLocation] = useState<
        Record<string, { teacherId: string; teacherName: string; teacherImage: string; latitude: number; longitude: number }>
    >({});

    const y = useMotionValue(0);
    const [expanded, setExpanded] = useState(true);

    const expandedHeight = "80vh";
    const collapsedHeight = "20vh";

    // Background overlay opacity
    const overlayOpacity = useTransform(y, [0, 300], [0.5, 0]);

    // console.log(siblings, "sibling of te united united satate")


    useEffect(() => {
        let socket: any;
        const connectToTeacher = async () => {
            try {
                socket = await connectSocket(selectedTeacherId, "");

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error("Socket Connection Time out"));
                    }, 1000);

                    socket.on("connect", () => {
                        clearTimeout(timeout);
                        // console.log("Socket connected and ready!, from parent", socket.id);

                        //since we using teacher id to subscribe does tha mean, all the parentsa can see all the location? fix this potential error
                        // subscribe parent to teacher room
                        socket.emit("subscribe-teacher", { selectedTeacherId });

                        resolve(true);
                    });

                    socket.on("connect_error", (error: any) => {
                        console.log(error, "errors from socket");
                        clearTimeout(timeout);
                        reject(error);
                    });
                });


                socket.on("teacher-location-update", (location: TeacherLocation) => {
                    // console.log(" Location update received at parent:", location);
                    setTeacherLocation((prev) => ({
                        ...prev,
                        [location.teacherId]: location,
                    }));
                });

                socket.on("disconnect", (reason: string) => {
                    console.log("Parent socket disconnected:", reason);
                });
            } catch (error) {
                console.error("Failed to connect parent socket:", error);
            }
        };

        connectToTeacher();

        return () => {
            if (socket) socket.disconnect();
        };
    }, [selectedTeacherId]);


    useEffect(() => {
        if (!parentId) return;
        const currentLocation = localStorage.getItem(`${parentId}-parentLocation`);
        if (currentLocation) {
            const parsedLocation = JSON.parse(currentLocation);
            setTeacherLocation((prev) => ({
                ...prev,
                [parsedLocation.teacherId]: parsedLocation,
            }));
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            window.localStorage.setItem(`${parentId}-parentLocation`, JSON.stringify({
                parentId: parentId,
                latitude,
                longitude,
            }));
            console.log("Current coordinates:", { latitude, longitude });
        })

    }, [parentId])


    // useEffect(() => {
    //     if (!window.google) return;
    //     const teacher = teacherLocation[selectedTeacherId] || null;

    //     const service = new google.maps.DistanceMatrixService();

    //     service.getDistanceMatrix(
    //         {
    //             origins: [{ lat: teacher?.latitude, lng: teacher?.longitude }],
    //             // origins: [{ lat: 9.171772891650901, lng: 7.352188010149178 }],
    //             destinations: coords2 ? [{ lat: coords2[0], lng: coords2[1] }] : [],
    //             travelMode: google.maps.TravelMode.DRIVING,
    //             region: "NG",
    //         },

    //         (response, status) => {
    //             if (status === "OK") {
    //                 const element = response?.rows[0].elements[0];
    //                 setStudentEta(element?.duration?.text || "Calculating...");
    //             } else {
    //                 console.error("DistanceMatrix failed:", status);
    //             }
    //         }
    //     );
    // }, [coords2, coords1]);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Map at full screen */}
            <div className="absolute inset-0">
                <TeacherLocationTracker
                    parentAddress={parentAddress || ""}
                    teacherId={selectedTeacherId || ""}
                    siblings={siblings}
                    teacherLocation={teacherLocation}
                />
            </div>

            {/* Semi-transparent backdrop (for clicking outside to collapse) */}
            {expanded && (
                <motion.div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                    onClick={() => setExpanded(false)}
                />
            )}

            {/* Bottom sheet */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) {
                        setExpanded(false);
                    } else {
                        setExpanded(true);
                    }
                }}
                initial={{ y: 0 }}
                animate={{
                    height: expanded ? expandedHeight : collapsedHeight,
                    y: 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg overflow-y-auto"
            >
                {/* Drag handle */}
                <div className="w-full flex justify-center p-2">
                    <div className="w-12 h-1.5 bg-gray-400 rounded-full" />
                </div>

                {/* Parent kids data */}
                <ParentViewData userId={parentId} />
            </motion.div>
        </div>
    );
}
