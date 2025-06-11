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
import { useSession } from "@/hooks/useSession"; // Custom hook for managing user session
import { updateLocation } from "@/actions/mark-otw";
import { publishLocation } from "@/utils/ably-teacher";

type NavbarProps = {
    data: any; // Expected props, with 'data' holding user or teacher information
};

const Navbar = ({ data }: NavbarProps) => {
    const [isHovering, setIsHovering] = useState(false); // Manages hover state for the profile
    const [isTracking, setIsTracking] = useState<boolean>(false); // Manages the location tracking toggle state
    const router = useRouter(); // Provides router functionalities for navigation
    // const [longitude, latitude] = await getCurrentLocation();


    // Memoize avatar content to prevent unnecessary re-renders
    const avatarContent = useMemo(() => {
        return data?.image ? (
            <AvatarImage src={data?.image} alt="@shadcn" />
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
        // Save the new tracking state to localStorage
        window.localStorage.setItem("tracking", JSON.stringify(newTrackingState));
    };


    // Restore tracking state from localStorage when component mounts
    useEffect(() => {
        const storedTracking = window.localStorage.getItem("tracking");
        if (storedTracking) {
            setIsTracking(JSON.parse(storedTracking)); // Restore the switch state from localStorage
        }
    }, []); // Run this effect only once when the component mounts


    /**
     * useEffect hook to start location tracking when the switch is toggled on.
     * Location updates every 10 seconds when tracking is enabled.
     */
    useEffect(() => {
        const updateLocation = async () => {
            try {
                // Get current coordinates
                const [longitude, latitude] = await getCurrentLocation();
                // Send the teacher's location to the server

                await publishLocation(latitude, longitude, data.id, data.name, data.image,);
                sendTeacherLocationToServer(latitude, longitude, data.id, data.image, data.name);
            } catch (error) {
                console.error('Error fetching location:', error);
                setIsTracking(false);
                window.localStorage.setItem("tracking", "false");
            }
        };
        if (isTracking) {
            // Initial update
            updateLocation();
            // Set an interval to update location every 10 seconds
            const intervalId = setInterval(updateLocation, 10000);

            // Cleanup function
            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            }
        }
    }, [isTracking, data]);



    return (
        <div className="flex justify-between bg-[var(--bg-root)] h-[60px] w-full items-center px-4 py-4 mb-5 mt-5">
            {/* Profile section: Clicking navigates back, and Lottie animation is triggered on hover */}
            <div
                className="flex space-x-2 items-center justify-center cursor-pointer"
                // onClick={() => router.back()} // Navigates back to the previous page
                onMouseEnter={() => setIsHovering(true)} // Enable hover effect
                onMouseLeave={() => setIsHovering(false)} // Disable hover effect
            >
                <Avatar>{avatarContent}</Avatar>

                {/* User details section (greeting and name display) */}
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

            {/* Notification and action section (e.g., tracking, notifications, logout) */}
            <div className="flex space-x-2 items-center justify-center">
                {data.role === "teacher" && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {/* Location toggle switch for teachers */}
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
                {/* Display notification feed component */}
                <NotificationFeed />
                {/* Logout button */}
                <span className="cursor-pointer">
                    <Logout />
                </span>
            </div>
        </div>
    );
};

export default Navbar;
