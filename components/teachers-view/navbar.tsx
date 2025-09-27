"use client"
import { useRouter } from "next/navigation"; // Provides router functionalities for navigation
import { MdNotifications } from "react-icons/md"; // Import notification icon from react-icons
import LottieAnimation from "../dashboard/sidebar/menuLink/lottie-animation"; // Import Lottie animation component
import { useEffect, useMemo, useState } from "react"; // Hooks for managing component state and side effects
import userprofile from "@/public/images/userProfile.json"; // Lottie animation data for user profile
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"; // UI components for Avatar display
import NotificationFeed from "@/components/knock/notitification-feed"; // Notification feed component
import NotificationRequest from "@/components/webnotifications/notificattions"; // Web notification request component
import Logout from "../dashboard/sidebar/logout"; // Logout button/component
import { Switch } from "@/components/ui/switch"; // Toggle switch UI component
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"; // Tooltip components for displaying extra info

import { getCurrentLocation, sendTeacherLocationToServer } from "../maps/lib/utils"; // Utility functions for geolocation and sending location
import { useSession } from "@/hooks/useSession";
import { updateLocation } from "@/actions/mark-otw";
import { publishLocation } from "@/utils/ably-teacher";
import { useRef } from "react";
import { connectSocket } from "@/utils/socket-client";
import { io } from "socket.io-client";
import { string } from "zod";

type NavbarProps = {
    data: any;
};

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
    const [isHovering, setIsHovering] = useState(false); // Manages hover state for the profile
    const [isTracking, setIsTracking] = useState<boolean>(false); // Manages the location tracking toggle state
    const [newLocation, setNewLocation] = useState({ teacherId: string, teacherName: string, teacherImage: string, longitude: string, lattitude: string, schoolId: string })
    // Provides router functionalities for navigation
    const router = useRouter();
    const lastSentTimeRef = useRef(0);
    const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

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
        const newTrackingState = !isTracking;
        setIsTracking(newTrackingState);
        window.localStorage.setItem("tracking", JSON.stringify(newTrackingState));
    };

    // Restore tracking state from localStorage when component mounts
    useEffect(() => {
        const storedTracking = window.localStorage.getItem("tracking");
        if (storedTracking) {
            // Restore the switch state from localStorage
            setIsTracking(JSON.parse(storedTracking));
        }
    }, []);

    useEffect(() => {
        const getLocation = async () => {
            const [longitude, latitude] = await getCurrentLocation();
            //@ts-ignore
            setNewLocation({ teacherId: data?.id, teacherName: data?.name, teacherImage: data?.image, longitude, latitude, schoolId: data?.schoolId })
        }

        const intervalId = setInterval(getLocation, 10000);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        }

        // getLocation()
    }, [data])

    console.log(data, "data from teachers navbar")


    useEffect(() => {
        let socket: any;
        const connectToTeacher = async () => {
            try {
                socket = await connectSocket(data?.id, "cmfa3hp6w000cy0hfdhz34f8o");

                // Wait for connection or timeout
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error("Socket connection timeout"));
                    }, 10000);

                    socket.on("connect", () => {
                        clearTimeout(timeout);
                        console.log("Socket connected and ready!", socket.id);
                        resolve(true);
                    });

                    socket.on("connect_error", (error: any) => {
                        console.log(error, "errors from socket")
                        clearTimeout(timeout);
                        reject(error);
                    });
                });
                socket.emit("teacher-live-location", {
                    newLocation
                });

                socket.on("teacher-location-update", (newLocation: any) => {
                    console.log(" Teacher location update received:", newLocation);
                });

                socket.on("disconnect", (reason: any) => {
                    console.log("🔌 Socket disconnected:", reason);
                });

                // Store reference for location updates

            } catch (error) {
                console.error(" Socket connection failed:", error);
                // You could show a user notification here
            }
        };

        if (data?.id) {
            connectToTeacher();
        }


    }, [data?.id, newLocation, data]);


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

    useEffect(() => {

        const updateLocation = async () => {

            try {
                const [longitude, latitude] = await getCurrentLocation();
                const now = Date.now();

                // Throttle: only send if 10+ seconds passed AND moved > 10m
                if (now - lastSentTimeRef.current < 10000) return;

                if (lastCoordsRef.current) {
                    const moved = getDistanceMetersFast(lastCoordsRef.current, {
                        lat: latitude,
                        lng: longitude,
                    });
                    if (moved < 10) return;
                    console.log("Updating location...");
                }

                await Promise.all([
                    publishLocation(latitude, longitude, data.id, data.name, data.image),
                    sendTeacherLocationToServer(latitude, longitude, data.id, data.image, data.name),
                ]);

                lastSentTimeRef.current = now;
                lastCoordsRef.current = { lat: latitude, lng: longitude };

                console.log("Location sent:", latitude, longitude);
            } catch (error: any) {
                console.error("Error fetching location:", error);
                if (error.code === 1) {
                    setIsTracking(false);
                    window.localStorage.setItem("tracking", "false");
                }
            }
        };


        if (isTracking) {
            updateLocation();

            const intervalId = setInterval(updateLocation, 10000);

            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            }
        }
    }, [isTracking, data]);



    return (
        <div className="flex justify-between bg-[var(--bg-root)] h-[60px] w-full items-center px-4 py-4 mb-5 mt-5">
            <div
                className="flex space-x-2 items-center justify-center cursor-pointer"
                // onClick={() => router.back()} // Navigates back to the previous page
                onMouseEnter={() => setIsHovering(true)} // Enable hover effect
                onMouseLeave={() => setIsHovering(false)} // Disable hover effect
            >
                <Avatar>{avatarContent}</Avatar>

                <div className="flex flex-col items-start">
                    {
                        data &&
                        <small className="text-[#606060] capitalize">Good day {data.role}!</small>
                    }
                    <span className="text-[1.1rem] font-medium capitalize text-[#EEEEEE]">
                        {data?.name || "coordinator"}
                    </span>
                </div>
            </div>

            <div className="flex space-x-2 items-center justify-center">
                {data.role === "teacher" && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center space-x-1 flex-col">
                                    <Switch id="location-toggle" onClick={toggleTracking} checked={isTracking} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle your location</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <NotificationFeed />
                <span className="cursor-pointer">
                    <Logout />
                </span>
            </div>
        </div>
    );
};

export default Navbar;
