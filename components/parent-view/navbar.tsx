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
        <div className="sticky top-0 z-30 flex h-[64px] w-full items-center justify-between border-b border-black/10 bg-white px-4 py-4 text-black">
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
                        <small className="text-black/50">Good day Parent!</small>
                    }
                    <span className="text-[1.1rem] font-semibold capitalize text-black">
                        {data?.name || "Parent"}
                        {/* Default to "coordinator" if name isn't provided */}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2">

                <NotificationFeed />
                <span className="cursor-pointer rounded-full p-1 hover:bg-black/5">
                    <Logout />
                </span>
            </div>
        </div>
    );
};

export default ParentNavbar;
