"use client"
import Image from "next/image"
import students from "@/public/images/students.svg"
import { useState } from "react";
import LottieAnimation from "../sidebar/menuLink/lottie-animation";
import userprofile from "@/public/images/userProfile.json"
import { useSession } from "next-auth/react";

export const DashboardHeader = () => {
    const [isHovering, setIsHovering] = useState(false);
    const { data: session } = useSession()

    console.log(session)

    return (
        <div className="flex items-center justify-start space-x-3 mb-3 cursor-pointer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >

            <div style={{ width: 40, height: 40 }}>
                <LottieAnimation isHovering={isHovering} animationData={userprofile} />
            </div>
            <div className="flex flex-col" >
                <span className="text-[1rem] font-medium capitalize">{session?.user?.name || "admin"}</span>
                <span className="text-[0.7rem] text-[#b7cac1]">{session?.user?.role || "admin"}</span>
            </div>
        </div>
    )
}
