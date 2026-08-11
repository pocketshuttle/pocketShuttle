"use client"
import { useEffect, useMemo, useState } from "react"; // Hooks for managing component state and side effects
import {
    Avatar,
    AvatarImage,
} from "@/components/ui/avatar"; // UI components for Avatar display
import NotificationFeed from "@/components/knock/notitification-feed"; // Notification feed component
import { KnownDriverNotificationBell } from "@/components/known-driver-network/notification-bell";
import { CarFront, LifeBuoy, Plus } from "lucide-react";
import { SupportTicketDialog } from "@/components/support/support-ticket-dialog";


type NavbarProps = {
    data: any;
    showAddKid?: boolean;
    showAddDriver?: boolean;
};


const ParentNavbar = ({ data, showAddKid = false, showAddDriver = false }: NavbarProps) => {
    const [greeting, setGreeting] = useState("Good day");
    const [supportOpen, setSupportOpen] = useState(false);
    const [limits, setLimits] = useState({
        childLimitReached: false,
        driverLimitReached: false,
    });

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

    useEffect(() => {
        const updateLimits = (event: Event) => {
            const detail = (event as CustomEvent<{
                childLimitReached?: boolean;
                driverLimitReached?: boolean;
            }>).detail;
            setLimits({
                childLimitReached: detail?.childLimitReached === true,
                driverLimitReached: detail?.driverLimitReached === true,
            });
        };
        const stored = window.sessionStorage.getItem("standalone-parent-limits");
        if (stored) {
            try {
                const detail = JSON.parse(stored);
                setLimits({
                    childLimitReached: detail?.childLimitReached === true,
                    driverLimitReached: detail?.driverLimitReached === true,
                });
            } catch {
                window.sessionStorage.removeItem("standalone-parent-limits");
            }
        }
        window.addEventListener("standalone-parent:limits-updated", updateLimits);
        return () => window.removeEventListener("standalone-parent:limits-updated", updateLimits);
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
            <AvatarImage src="/images/parent.jpg" alt="Parent" />
        );
    }, [data?.image]);


    return (
        <div className="sticky top-0 z-30 flex min-h-16 w-full max-w-full items-center gap-2 overflow-x-hidden border-b border-black/10 bg-white px-3 py-2.5 text-black sm:gap-3 sm:px-4">
            <div
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                onClick={() => window.dispatchEvent(new CustomEvent("standalone-parent:open-menu"))}
            >
                <Avatar className="h-10 w-10 shrink-0">{avatarContent}</Avatar>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                    {
                        data &&
                        <small className="text-xs leading-tight text-black/45">{greeting}</small>
                    }
                    <span className="w-full truncate text-base font-semibold capitalize leading-tight text-black sm:text-lg">
                        {firstName}
                    </span>
                </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center justify-center gap-2">

                {showAddKid && (
                    <button
                        type="button"
                        disabled={limits.childLimitReached}
                        onClick={() => window.dispatchEvent(new CustomEvent("standalone-parent:add-kid"))}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#4a48ff] text-white transition hover:bg-[#5b5aff] focus:outline-none focus:ring-2 focus:ring-[#4a48ff]/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Add kid"
                        title={limits.childLimitReached ? "Upgrade your plan to add another child" : "Add kid"}
                    >
                        <Plus className="h-5 w-5" aria-hidden="true" />
                    </button>
                )}
                {showAddDriver && (
                    <button
                        type="button"
                        disabled={limits.driverLimitReached}
                        onClick={() => window.dispatchEvent(new CustomEvent("standalone-parent:add-driver"))}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Add driver"
                        title={limits.driverLimitReached ? "Upgrade your plan to add another driver" : "Add driver"}
                    >
                        <CarFront className="h-5 w-5" aria-hidden="true" />
                    </button>
                )}
                {showAddKid ? (
                    <KnownDriverNotificationBell role="parent" id={String(data?.id || "")} />
                ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md [&_button]:grid [&_button]:h-10 [&_button]:w-10 [&_button]:place-items-center [&_button]:rounded-md [&_button]:p-0 [&_svg]:h-5 [&_svg]:w-5">
                        <NotificationFeed />
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => setSupportOpen(true)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950/20 active:scale-95"
                    aria-label="Contact support"
                    title="Contact support"
                >
                    <LifeBuoy className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
            <SupportTicketDialog
                open={supportOpen}
                onClose={() => setSupportOpen(false)}
                requesterName={data?.name}
                requesterId={data?.id}
                requesterLabel="Parent"
            />
        </div>
    );
};

export default ParentNavbar;
