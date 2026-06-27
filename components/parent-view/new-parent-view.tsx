"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ParentViewData from "./parentdata";
import { TeacherLocationTracker } from "../maps/Map/teachersLocation/teacher-parent-map";
import { connectSocket } from "@/utils/socket-client";
import OneSignal from "react-onesignal";
import { KidsViewTab } from "./kids-tab";
import { StudentProps } from "@/types";
import { canUseOneSignal } from "@/onesignal/utils";

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

type TeacherLocationMessage = TeacherLocation | { newLocation: TeacherLocation };

const getTeacherLocation = (message: TeacherLocationMessage) => {
    return "newLocation" in message ? message.newLocation : message;
};

const shouldTrackTeacher = (siblings: StudentProps[], selectedStudentId: string | null) => {
    //if student has been picked up, we stop tracking
    const selectedStudent = siblings.find((s) => s.id === selectedStudentId);
    return selectedStudent?.status !== "PICKED" || selectedStudent?.presence === "ON_THE_WAY";
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

    console.log("Rendering NewParentPage with siblings:", parentAddress, parentAddressCoords);


    //we take the first teacher
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
        siblings.length > 0 ? siblings[0].id : null
    )

    useEffect(() => {
        //resttore the last selcected on mount
        const savedId = localStorage.getItem("selectedStudentId")
        if (savedId && siblings.some((s: StudentProps) => s.id === savedId)) {
            setSelectedStudentId(savedId)
        } else if (siblings.length > 0) {
            setSelectedStudentId(siblings[0]?.id)
            localStorage.setItem("selectedStudentId", siblings[0].id)
        }
    }, [siblings])

    // Persist student selection to localStorage
    useEffect(() => {
        if (selectedStudentId) {
            localStorage.setItem("selectedStudentId", selectedStudentId);
        }
    }, [selectedStudentId]);

    useEffect(() => {
        if (!parentId) return;
        if (!canUseOneSignal()) return;

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

    const canTrackSelectedTeacher = useMemo(
        () => shouldTrackTeacher(siblings, selectedStudentId),
        [siblings, selectedStudentId]
    );

    const y = useMotionValue(0);
    const [expanded, setExpanded] = useState(true);

    const expandedHeight = "72svh";
    const collapsedHeight = "22svh";

    // Background overlay opacity
    const overlayOpacity = useTransform(y, [0, 300], [0.5, 0]);

    useEffect(() => {
        if (!selectedTeacherId || !parentId) return;
        if (!canTrackSelectedTeacher) return;

        let socket: any;
        let isMounted = true;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

        const connectToTeacher = async () => {
            try {
                socket = await connectSocket(selectedTeacherId, "", parentId);

                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error("Socket Connection Timeout")), 3000);

                    socket.on("connect", () => {
                        clearTimeout(timeout);
                        if (!isMounted) return;
                        socket.emit("subscribe-teacher", { teacherId: selectedTeacherId, parentId });
                        socket.emit("join-parent-room", parentId);
                        resolve();
                    });

                    socket.on("connect_error", (error: any) => {
                        console.error("Socket connect_error:", error);
                        clearTimeout(timeout);
                        reject(error);
                    });
                });

                socket.on("teacher-location-update", (message: TeacherLocationMessage) => {
                    if (!isMounted) return;
                    const location = getTeacherLocation(message);
                    if (!location?.teacherId) return;

                    setTeacherLocation(prev => ({
                        ...prev,
                        [location.teacherId]:
                            prev[location.teacherId]?.latitude === location.latitude &&
                                prev[location.teacherId]?.longitude === location.longitude
                                ? prev[location.teacherId]
                                : location,
                    }));
                });

                socket.io.on("reconnect", () => {
                    socket.emit("subscribe-teacher", { teacherId: selectedTeacherId, parentId });
                    socket.emit("join-parent-room", parentId);
                });

                socket.on("disconnect", (reason: string) => {
                    if (isMounted && reason !== "io client disconnect") {
                        reconnectTimer = setTimeout(connectToTeacher, 5000);
                    }
                });
            } catch (error) {
                console.error("Failed to connect parent socket:", error);
            }
        };

        connectToTeacher();

        return () => {
            isMounted = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (socket) {
                socket.off("teacher-location-update");
                socket.disconnect();
            }
        };
    }, [selectedTeacherId, parentId, canTrackSelectedTeacher]);

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
        <div className="min-h-screen bg-gray-100 text-black">

            <KidsViewTab
                siblings={siblings}
                selectedStudentId={selectedStudentId}
                onSelect={setSelectedStudentId}
            />
            <div className="relative h-[calc(100svh-124px)] min-h-[420px] w-full overflow-hidden bg-gray-100">
                {/* Map at full screen */}
                <div className="absolute inset-0">
                    <TeacherLocationTracker
                        parentAddress={parentAddress || ""}
                        parentAddressCoords={parentAddressCoords}
                        teacherId={selectedTeacherId || ""}
                        teacherLocation={teacherLocation}
                        userId={parentId}
                    />
                </div>

                {/* Semi-transparent backdrop (for clicking outside to collapse) */}
                {expanded && (
                    <motion.div
                        className="absolute inset-0 bg-black/20"
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
                    className="absolute bottom-0 left-0 right-0 overflow-y-auto rounded-t-3xl border border-black/10 bg-white text-black"
                >
                    {/* Drag handle */}
                    <div className="sticky top-0 z-10 flex w-full justify-center bg-white/95 p-3 backdrop-blur">
                        <div className="h-1.5 w-12 rounded-full bg-black/20" />
                    </div>

                    {/* Parent kids data */}
                    <ParentViewData userId={parentId} />
                </motion.div>
            </div>
        </div>

    );
}
