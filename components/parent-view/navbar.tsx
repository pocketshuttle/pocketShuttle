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


type NavbarProps = {
    data: any;
};


const ParentNavbar = ({ data }: NavbarProps) => {
    const [isHovering, setIsHovering] = useState(false); // Manages hover state for the profile
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
                        <small className="text-[#606060]">Good day Parent!</small>
                    }
                    <span className="text-[1.1rem] font-medium capitalize text-[#EEEEEE]">
                        {data?.name || "Parent"}
                        {/* Default to "coordinator" if name isn't provided */}
                    </span>
                </div>
            </div>

            <div className="flex space-x-2 items-center justify-center">

                <NotificationFeed />
                <span className="cursor-pointer">
                    <Logout />
                </span>
            </div>
        </div>
    );
};

export default ParentNavbar;
