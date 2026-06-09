"use client"
import LottieAnimation from "../dashboard/sidebar/menuLink/lottie-animation"; // Import Lottie animation component
import { useEffect, useMemo, useRef, useState } from "react"; // Hooks for managing component state and side effects
import userprofile from "@/public/images/userProfile.json"; // Lottie animation data for user profile
import {
    Avatar,
    AvatarImage,
} from "@/components/ui/avatar"; // UI components for Avatar display
import NotificationFeed from "@/components/knock/notitification-feed"; // Notification feed component
import Logout from "../dashboard/sidebar/logout"; // Logout button/component
import { Switch } from "@/components/ui/switch"; // Toggle switch UI component
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { getCurrentLocation } from "../maps/lib/utils"; // Utility functions for geolocation and sending location
import { connectSocket } from "@/utils/socket-client";

type NavbarProps = {
    data: any;
};

type TeacherLocationPayload = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    longitude: number;
    latitude: number;
    schoolId: string;
};

const LOCATION_SEND_INTERVAL_MS = 20_000;
const LOCATION_POLL_INTERVAL_MS = 100_000;
const MIN_LOCATION_DELTA_METERS = 10;

const getTrackingKey = (teacherId?: string) => `tracking:${teacherId || "unknown"}`;

function isPermissionDenied(error: unknown) {
    return (
        typeof error === "object" &&
        error !== null &&
        ("code" in error && (error as { code?: number }).code === 1)
    );
}

function getDistanceMetersFast(coord1: any, coord2: any) {
    const R = 6371000;
    const lat1 = coord1.lat * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const x = dLng * Math.cos((lat1 + lat2) / 2);
    const y = dLat;
    return Math.sqrt(x * x + y * y) * R;
}

const Navbar = ({ data }: NavbarProps) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isTracking, setIsTracking] = useState<boolean>(false);
    const [newLocation, setNewLocation] = useState<TeacherLocationPayload>({
        teacherId: '',
        teacherName: '',
        teacherImage: '',
        longitude: 0,
        latitude: 0,
        schoolId: ''
    });

    const lastSentTimeRef = useRef(0);
    const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
    const socketRef = useRef<any>(null);
    const latestLocationRef = useRef<TeacherLocationPayload | null>(null);

    // Memoize avatar content to prevent unnecessary re-renders
    const avatarContent = useMemo(() => {
        return data?.image ? (
            <AvatarImage src={data?.image} alt="name" />
        ) : (
            <div style={{ width: 40, height: 40 }}>
                <LottieAnimation isHovering={isHovering} animationData={userprofile} />
            </div>
        );
    }, [isHovering, data?.image]);

    // Toggle the state of location tracking (switch on/off)
    const toggleTracking = () => {
        if (!data?.id) return;
        const newTrackingState = !isTracking;
        setIsTracking(newTrackingState);
        window.localStorage.setItem(getTrackingKey(data.id), JSON.stringify(newTrackingState));
    };

    // Restore tracking state from localStorage when component mounts
    useEffect(() => {
        if (!data?.id) return;

        const storedTracking = window.localStorage.getItem(getTrackingKey(data.id));
        if (storedTracking) {
            // Restore the switch state from localStorage
            setIsTracking(JSON.parse(storedTracking));
        }
    }, [data?.id]);

    useEffect(() => {
        const getLocation = async () => {
            try {
                const [longitude, latitude] = await getCurrentLocation();

                if (!data?.id) {
                    console.log("No teacher data available");
                    return;
                }
                const now = Date.now();

                //throttlin, so we spend every min and if teacher/coordinator has moved  > 10m
                if (now - lastSentTimeRef.current < LOCATION_SEND_INTERVAL_MS) return

                if (lastCoordsRef.current) {
                    const moved = getDistanceMetersFast(lastCoordsRef.current, {
                        lat: latitude,
                        lng: longitude,
                    });
                    if (moved < MIN_LOCATION_DELTA_METERS) return;
                }

                const nextLocation = {
                    teacherId: data.id,
                    teacherName: data.name || '',
                    teacherImage: data.image || '',
                    longitude,
                    latitude,
                    schoolId: data.schoolId || ''
                };

                latestLocationRef.current = nextLocation;
                setNewLocation(nextLocation);

                lastSentTimeRef.current = now
                lastCoordsRef.current = { lat: latitude, lng: longitude }

            } catch (error: any) {
                if (isPermissionDenied(error)) {
                    setIsTracking(false);
                    window.localStorage.setItem(getTrackingKey(data?.id), "false");
                    return;
                }

                console.error("Error getting location:", error);
            }
        };

        // Initial location fetch
        if (isTracking) {
            getLocation();

            // Update every 1 mins (100000ms)
            const intervalId = setInterval(getLocation, LOCATION_POLL_INTERVAL_MS);

            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            }
        };
    }, [data?.id, data?.name, data?.image, data?.schoolId, isTracking])


    useEffect(() => {
        if (!data?.id) return;

        let isMounted = true;

        const connectToTeacher = async () => {
            try {
                const socket = await connectSocket(data.id, data?.schoolId);
                if (!isMounted) {
                    socket.disconnect();
                    return;
                }

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error("Socket connection timeout"));
                    }, 10000);

                    socket.on("connect", () => {
                        clearTimeout(timeout);
                        socket.emit("join-teacher-room", data.id);
                        if (latestLocationRef.current?.teacherId) {
                            socket.emit("teacher-live-location", { newLocation: latestLocationRef.current });
                            socket.emit("teacher-location-update", latestLocationRef.current);
                        }
                        resolve(true);
                    });

                    socket.on("connect_error", (error: any) => {
                        console.log("Socket connection error:", error.message);
                    });
                });

                socketRef.current = socket;

            } catch (error) {
                console.error(" Socket connection failed:", error);
            }
        };

        connectToTeacher();

        return () => {
            isMounted = false;
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [data?.id, data?.schoolId]);

    useEffect(() => {
        if (!newLocation.teacherId || !socketRef.current?.connected) return;

        socketRef.current.emit("teacher-live-location", { newLocation });
        socketRef.current.emit("teacher-location-update", newLocation);
    }, [newLocation]);


    /**
     * useEffect hook to start location tracking when the switch is toggled on.
     * Location updates every 10 seconds when tracking is enabled.
     */


    /**
     * updateLocation()
     *
     * Purpose:
     * --------
     * Sends the teacher's current location to both the real-time channel (Ably) and the server API,
     * but in a way that balances responsiveness with bandwidth/cost efficiency.
     *
     * How it works:
     * -------------
     * 1. **Get Current Location**
     *    - Uses `getCurrentLocation()` to fetch the teacher's latitude & longitude.
     *
     * 2. **Throttle Updates by Time**
     *    - Normally, updates are sent at most every `maxUpdateIntervalMs` (default 10 seconds).
     *    - Prevents spamming Ably/Pusher and reduces server load.
     *
     * 3. **Immediate Update on Significant Movement**
     *    - If the teacher moves more than `immediateUpdateDistanceM` (default 50 meters)
     *      before the time limit is reached, we bypass throttling and send immediately.
     *    - This ensures the map is responsive for fast-moving teachers (e.g., driving).
     *
     * 4. **Distance Calculation**
     *    - Uses `ersFast()` (Equirectangular approximation) for speed over
     *      the more precise Haversine formula, since accuracy within ~1m is sufficient.
     *
     * 5. **Refs for State Between Updates**
     *    - `lastSentTimeRef` stores the timestamp of the last sent update.
     *    - `lastCoordsRef` stores the last sent coordinates so we can measure movement.
     *
     * 6. **Error Handling**
     *    - If location permission is denied (error code 1), tracking is disabled
     *      and `localStorage` is updated so it stays off after refresh.
     *
     * Configurable Parameters (future dashboard settings):
     * -----------------------------------------------------
     * - `maxUpdateIntervalMs` (default: 10_000 ms / 10 seconds)
     *   Maximum allowed interval between location updates when moving slowly.
     *
     * - `immediateUpdateDistanceM` (default: 50 meters)
     *   Distance threshold to trigger an immediate update before the time limit.
     *
     
     */

    // useEffect(() => {

    //     const updateLocation = async () => {

    //         try {
    //             const [longitude, latitude] = await getCurrentLocation();
    //             const now = Date.now();

    //             // Throttle: only send if 10+ seconds passed AND moved > 10m
    //             if (now - lastSentTimeRef.current < 10000) return;

    //             if (lastCoordsRef.current) {
    //                 const moved = getDistanceMetersFast(lastCoordsRef.current, {
    //                     lat: latitude,
    //                     lng: longitude,
    //                 });
    //                 if (moved < 10) return;
    //                 // console.log("Updating location...");
    //             }

    //             await Promise.all([
    //                 publishLocation(latitude, longitude, data.id, data.name, data.image),
    //                 sendTeacherLocationToServer(latitude, longitude, data.id, data.image, data.name),
    //             ]);

    //             lastSentTimeRef.current = now;
    //             lastCoordsRef.current = { lat: latitude, lng: longitude };

    //             console.log("Location sent:", latitude, longitude);
    //         } catch (error: any) {
    //             console.error("Error fetching location:", error);
    //             if (error.code === 1) {
    //                 setIsTracking(false);
    //                 window.localStorage.setItem("tracking", "false");
    //             }
    //         }
    //     };


    //     if (isTracking) {
    //         updateLocation();

    //         const intervalId = setInterval(updateLocation, 10000);

    //         return () => {
    //             if (intervalId) {
    //                 clearInterval(intervalId);
    //             }
    //         }
    //     }
    // }, [isTracking, data]);



    return (
        <div className="flex h-[64px] w-full items-center justify-between border-b border-black/10 bg-white px-5 py-5 text-black shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-black dark:text-white">
            {/* Left section: Avatar + Greeting */}
            <div
                className="flex items-center gap-3 cursor-pointer group"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div className="relative">
                    <Avatar className="ring-2 ring-gray-700 group-hover:ring-blue-500 transition duration-200">
                        {avatarContent}
                    </Avatar>
                    {isHovering && (
                        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-white bg-green-500 dark:border-black" />
                    )}
                </div>

                <div className="flex flex-col">
                    {/* {data && (
                            <small className="text-black/50 capitalize leading-none dark:text-white/50">
                                Good day, {data.role}!
                            </small>
                        )} */}
                    <span className="text-base font-semibold capitalize text-black dark:text-white">
                        {data?.name || "Coordinator"}
                    </span>
                </div>
            </div>

            {/* Right section: Controls */}
            <div className="flex items-center gap-4">
                {data?.role === "teacher" && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center">
                                    <Switch
                                        id="location-toggle"
                                        onClick={toggleTracking}
                                        checked={isTracking}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle your location</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                <div className="relative">
                    <NotificationFeed />
                </div>

                <button className="hover:bg-red-600/20 transition-colors duration-200 rounded-full p-2">
                    <Logout />
                </button>
            </div>
        </div>

    );
};

export default Navbar;
