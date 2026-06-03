"use client"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { MdNotifications, MdOutlineChat } from "react-icons/md"
import { Settings } from "lucide-react"
import { ModeSwitch } from "@/components/theme/mode-switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import bluefullname from "@/public/bluefullname.png"
import whitefullname from "@/public/Whitefullname.png"

const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return { label: "Good Morning", icon: "☀️" };
    }

    if (hour < 17) {
        return { label: "Good Afternoon", icon: "🌤️" };
    }

    return { label: "Good Evening", icon: "🌙" };
};

const Navbar = ({ data }: { data?: any }) => {
    const pathname = usePathname()
    const currentSegment = pathname.split("/").filter(Boolean).at(-1) || "dashboard";
    const pageTitle = currentSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    const name = data?.name || "admin";
    const greeting = getGreeting();
    const initials = name
        .split(" ")
        .map((word: string) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();


    return (
        <header className="flex h-24 w-full items-center justify-between bg-white px-5 transition-colors dark:bg-black lg:px-7">
            <div className="flex min-w-0 items-center gap-8">
                <div className="relative h-12 w-44 shrink-0">
                    <Image src={bluefullname} alt="PocketShuttle" fill className="object-contain dark:hidden" priority />
                    <Image src={whitefullname} alt="PocketShuttle" fill className="hidden object-contain dark:block" priority />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold leading-5 text-black dark:text-white">
                        <span className="mr-2">{greeting.icon}</span>
                        {greeting.label}, {name.toUpperCase()}
                    </p>
                    <p className="truncate text-xs font-medium leading-5 text-black/55 dark:text-white/60">
                        {pageTitle === "Dashboard"
                            ? "Manage students, teachers, buses and commute activity"
                            : `Manage ${pageTitle.toLowerCase()} records and activity`}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
                <button className="relative grid h-12 w-12 place-items-center rounded-full bg-black/5 text-black transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15" aria-label="Notifications">
                    <MdNotifications size={20} />
                    {/* <span className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-black">
                        9+
                    </span> */}
                </button>

                <ModeSwitch />
                <button className="grid h-12 w-12 place-items-center rounded-full bg-black/5 text-black transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15" aria-label="Settings">
                    <Settings className="h-5 w-5" />
                </button>

                <div className="ml-1 flex items-center gap-3 rounded-full bg-black/5 p-1 pr-4 text-black dark:bg-white/10 dark:text-white">
                    <Avatar className="h-12 w-12">
                        {data?.image ? (
                            <AvatarImage src={data.image} alt={name} />
                        ) : (
                            <AvatarFallback className="bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
                                {initials}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="hidden max-w-[140px] flex-col leading-tight lg:flex">
                        <span className="truncate text-sm font-bold capitalize">{name}</span>
                        <span className="text-xs font-medium capitalize text-[var(--textSoft)]">{data?.role || "admin"}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar
