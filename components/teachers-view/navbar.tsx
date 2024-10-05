"use client"
import { useRouter } from "next/navigation"
import { MdNotifications } from "react-icons/md"
import LottieAnimation from "../dashboard/sidebar/menuLink/lottie-animation"
import { useEffect, useState } from "react"
import userprofile from "@/public/images/userProfile.json"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import NotificationFeed from "@/components/knock/notitification-feed"
import NotificationRequest from "@/components/webnotifications/notificattions"
import Logout from "../dashboard/sidebar/logout"
import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { getCurrentLocation, sendTeacherLocationToServer } from "../maps/lib/utils"
import { useSession } from "@/hooks/useSession"


type NavbarProps = {
    data: any
}
const Navbar = ({ data }: NavbarProps) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isTracking, setIsTracking] = useState<boolean>(false);

    const router = useRouter()
    const toggleTracking = () => {
        setIsTracking(!isTracking);
    };

    useEffect(() => {
        if (isTracking) {
            const updateLocation = async () => {
                try {
                    const [longitude, latitude] = await getCurrentLocation();
                    sendTeacherLocationToServer(latitude, longitude, data.id, data.image, data.name)
                } catch (error) {
                    console.error('Error fetching location:', error);
                }
            }
            // Update location every 10 seconds when tracking is on
            const intervalId = setInterval(updateLocation, 10000);
            return () => clearInterval(intervalId);
        }
    }, [isTracking])

    return (
        <div className="flex justify-between bg-[var(--bg-root)] h-[60px] w-full
        items-center px-4 mb-5">
            <div className="flex gap-[1rem]  items-center justify-center cursor-pointer" onClick={() => router.back()}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >

                <Avatar>
                    {data?.image ? (
                        <AvatarImage src={data?.image} alt="@shadcn" />
                    ) : (
                        <div style={{ width: 40, height: 40 }}>
                            <LottieAnimation isHovering={isHovering} animationData={userprofile} />
                        </div>
                    )}
                </Avatar>

                <div className="flex flex-col items-start ">
                    <span className="text-[1.5rem] font-medium capitalize">{data?.name || "admin"}</span>
                </div>


            </div>

            <div className="flex space-x-2 items-center justify-center">

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center space-x-1 flex-col">
                                <Switch id="location-toggle"
                                    onClick={toggleTracking}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Toggle your location</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                < NotificationFeed />

                <span

                    className="cursor-pointer"
                >
                    <Logout />
                </span>

            </div>

        </div>
    )
}

export default Navbar