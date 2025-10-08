"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ParentViewData from "./parentdata";
import { TeacherLocationTracker } from "../maps/Map/teachersLocation/teacher-parent-map";
import { connectSocket } from "@/utils/socket-client";
import OneSignal from "react-onesignal";
import { KidsViewTab } from "./kids-tab";
import { StudentProps } from "@/types";

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

const shouldTrackTeacher = (siblings: StudentProps[], selectedStudentId: string | null) => {
    //if student has been picked up, we stop tracking
    const selectedStudent = siblings.find((s) => s.id === selectedStudentId);
    return selectedStudent?.status !== "PICKED";
}
export default function NewParentPage({
    parentAddress,
    parentAddressCoords,
    parentId,
    siblings,
}: any) {
    const [teacherLocation, setTeacherLocation] = useState<
        Record<string, { teacherId: string; teacherName: string; teacherImage: string; latitude: number; longitude: number }>
    >({});

    useEffect(() => {
        if (!parentId) return;

        const loginToOneSignal = async () => {
            try {
                // Make sure SDK is initialized before trying login
                await OneSignal.User.PushSubscription.optIn();
                await OneSignal.login(parentId);

                // console.log(" OneSignal logged in:", parentId);
            } catch (err) {
                console.error(" OneSignal login failed:", err);
            }
        };

        // Small delay to ensure SDK has finished bootstrapping
        const timer = setTimeout(loginToOneSignal, 500);

        return () => clearTimeout(timer);
    }, [parentId]);

    //we take the first teahcer
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
        siblings.length > 0 ? siblings[0].id : null
    )

    const selectedSibling = useMemo(
        () => siblings.find((s: StudentProps) => s.id === selectedStudentId) || null,
        [siblings, selectedStudentId]
    )

    // get the teacher IDs for all siblings
    const allTeacherIds = useMemo(
        () => siblings.map((s: StudentProps) => s.bus?.teacher?.id).filter(Boolean),
        [siblings]
    )
    const uniqueTeacherIds = useMemo(
        () => new Set(allTeacherIds),
        [allTeacherIds]
    )

    // Decide the teacher ID to use for the map
    const selectedTeacherId = useMemo(() => {
        if (!selectedSibling) return null
        return uniqueTeacherIds.size === 1
            ? allTeacherIds[0] ?? null
            : selectedSibling.bus?.teacher?.id || null
    }, [uniqueTeacherIds, allTeacherIds, selectedSibling])


    const y = useMotionValue(0);
    const [expanded, setExpanded] = useState(true);

    const expandedHeight = "80vh";
    const collapsedHeight = "20vh";

    // Background overlay opacity
    const overlayOpacity = useTransform(y, [0, 300], [0.5, 0]);

    useEffect(() => {
        let socket: any;
        const connectToTeacher = async () => {
            try {
                socket = await connectSocket(selectedTeacherId, "");

                if (!selectedTeacherId || !shouldTrackTeacher(siblings, selectedTeacherId)) {
                    console.log("Teacher tracking stopped - student picked up");
                    return;
                }

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error("Socket Connection Time out"));
                    }, 1000);

                    socket.on("connect", () => {
                        clearTimeout(timeout);
                        // console.log("Socket connected and ready!, from parent", socket.id);

                        //since we using teacher id to subscribe does tha mean, all the parentsa can see all the location? fix this potential error
                        // subscribe parent to teacher room
                        socket.emit("subscribe-teacher", { selectedTeacherId, parentId });

                        resolve(true);
                    });

                    socket.on("connect_error", (error: any) => {
                        console.log(error, "errors from socket");
                        clearTimeout(timeout);
                        reject(error);
                    });
                });


                socket.on("teacher-location-update", (location: TeacherLocation) => {
                    console.log(" Location update received at parent:", location);
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
        <div>

            <KidsViewTab
                siblings={siblings}
                selectedStudentId={selectedStudentId}
                onSelect={setSelectedStudentId}
            />
            <div className="relative w-full h-[90vh] overflow-hidden">
                {/* Map at full screen */}
                <div className="absolute inset-0">
                    <TeacherLocationTracker
                        parentAddress={parentAddress || ""}
                        parentAddressCoords={parentAddressCoords}
                        teacherId={selectedTeacherId || ""}
                        siblings={siblings}
                        teacherLocation={teacherLocation}
                        userId={parentId}
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
        </div>

    );
}
