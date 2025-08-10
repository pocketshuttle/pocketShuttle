"use client" // Indicates the component is client-side only in Next.js
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

type NavbarProps = {
    data: any;
};



function getDistanceMeters(coord1: any, coord2: any) {
    const R = 6371e3; // meters
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const Navbar = ({ data }: NavbarProps) => {
    const [isHovering, setIsHovering] = useState(false); // Manages hover state for the profile
    const [isTracking, setIsTracking] = useState<boolean>(false); // Manages the location tracking toggle state
    const router = useRouter(); // Provides router functionalities for navigation

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
            setIsTracking(JSON.parse(storedTracking)); // Restore the switch state from localStorage
        }
    }, []);



    /**
     * useEffect hook to start location tracking when the switch is toggled on.
     * Location updates every 10 seconds when tracking is enabled.
     */


    useEffect(() => {
        const fetchLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    // console.log("Current coordinates:", { latitude, longitude });
                    // Send the teacher's location to the server
                    // await sendTeacherLocationToServer(latitude, longitude, data.id, data.image, data.name);
                }, (error) => {
                    console.error('Error fetching location:', error);
                    setIsTracking(false);
                    window.localStorage.setItem("tracking", "false");
                });
            }
        }
        fetchLocation()
    }, []);


    useEffect(() => {

        const updateLocation = async () => {
            try {
                const [longitude, latitude] = await getCurrentLocation();
                const now = Date.now();

                // Throttle: only send if 10+ seconds passed AND moved > 10m
                if (now - lastSentTimeRef.current < 10000) return;

                if (lastCoordsRef.current) {
                    const moved = getDistanceMeters(lastCoordsRef.current, {
                        lat: latitude,
                        lng: longitude,
                    });
                    if (moved < 10) return;
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

    useEffect(() => {
        const storedTracking = window.localStorage.getItem("tracking");
        if (storedTracking) {
            setIsTracking(JSON.parse(storedTracking));
        }
    }, []);

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
                        <small className="text-[#606060]">Good day {data.role}!</small>
                    }
                    <span className="text-[1.1rem] font-medium capitalize text-[#EEEEEE]">
                        {data?.name || "admin"} {/* Default to "admin" if name isn't provided */}
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
