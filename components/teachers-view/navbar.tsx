"use client"
import { useRouter } from "next/navigation"
import { MdNotifications } from "react-icons/md"
import LottieAnimation from "../dashboard/sidebar/menuLink/lottie-animation"
import { useState } from "react"
import userprofile from "@/public/images/userProfile.json"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import NotificationFeed from "@/components/knock/notitification-feed"
import NotificationRequest from "@/components/webnotifications/notificattions"
import Logout from "../dashboard/sidebar/logout"
type NavbarProps = {
    data: any
}
const Navbar = ({ data }: NavbarProps) => {
    const router = useRouter()
    const [isHovering, setIsHovering] = useState(false);

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
                < NotificationFeed />
                {/* <NotificationRequest /> */}
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