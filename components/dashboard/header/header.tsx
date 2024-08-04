"use client"
import Image from "next/image"
import logo from "@/public/images/logo.png"
import { useState } from "react";


export const DashboardHeader = () => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div className="flex items-center justify-start space-x-3 mb-3 cursor-pointer"
        >
            {/* <Image src={logo} alt="pocket shuttle" width={100} height={40} /> */}
            <p className="text-xl px-8">PocketShuttle</p>
        </div>
    )
}
