"use client" // Indicates the component is client-side only in Next.js
import LottieAnimation from "../dashboard/sidebar/menuLink/lottie-animation"; // Import Lottie animation component
import { useEffect, useMemo, useState } from "react"; // Hooks for managing component state and side effects
import userprofile from "@/public/images/userProfile.json"; // Lottie animation data for user profile
import {
    Avatar,
    AvatarImage,
} from "@/components/ui/avatar"; // UI components for Avatar display
import NotificationFeed from "@/components/knock/notitification-feed"; // Notification feed component
import { CarFront, Plus } from "lucide-react";


type NavbarProps = {
    data: any;
    showAddKid?: boolean;
    showAddDriver?: boolean;
};


const ParentNavbar = ({ data, showAddKid = false, showAddDriver = false }: NavbarProps) => {
    const [isHovering, setIsHovering] = useState(false); // Manages hover state for the profile
    const [greeting, setGreeting] = useState("Good day");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting("Good morning");
        } else if (hour < 17) {
            setGreeting("Good afternoon");
        } else {
            setGreeting("Good night");
        }
    }, []);

    const firstName = useMemo(() => {
        const name = data?.name || "Parent";
        return String(name).trim().split(/\s+/)[0] || "Parent";
    }, [data?.name]);

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
        <div className="sticky top-0 z-30 flex min-h-[72px] w-full max-w-full items-center gap-2 overflow-x-hidden border-b border-black/10 bg-white px-3 py-3 text-black sm:gap-3 sm:px-4">
            <div
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 sm:gap-2"
                onClick={() => window.dispatchEvent(new CustomEvent("standalone-parent:open-menu"))}
                onMouseEnter={() => setIsHovering(true)} // Enable hover effect
                onMouseLeave={() => setIsHovering(false)} // Disable hover effect
            >
                <Avatar className="h-10 w-10 shrink-0 sm:h-11 sm:w-11">{avatarContent}</Avatar>

                <div className="flex min-w-0 flex-1 flex-col items-start">
                    {
                        data &&
                        <small className="text-xs leading-none text-black/45">{greeting}</small>
                    }
                    <span className="w-full truncate text-[1rem] font-semibold capitalize leading-tight text-black sm:text-xl">
                        {firstName}
                    </span>
                </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center justify-center gap-1.5 sm:gap-2">

                {showAddKid && (
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent("standalone-parent:add-kid"))}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4a48ff] text-white shadow-sm transition hover:bg-[#5b5aff] focus:outline-none focus:ring-2 focus:ring-[#4a48ff]/30 active:scale-95 sm:h-11 sm:w-11"
                        aria-label="Add kid"
                        title="Add kid"
                    >
                        <Plus className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    </button>
                )}
                {showAddDriver && (
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent("standalone-parent:add-driver"))}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950/20 active:scale-95 sm:h-11 sm:w-11"
                        aria-label="Add driver"
                        title="Add driver"
                    >
                        <CarFront className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    </button>
                )}
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full sm:h-11 sm:w-11 [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-full sm:[&_button]:h-11 sm:[&_button]:w-11">
                    <NotificationFeed />
                </span>
            </div>
        </div>
    );
};

export default ParentNavbar;
