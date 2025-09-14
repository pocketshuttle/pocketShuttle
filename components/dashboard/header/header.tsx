"use client"
import Image from "next/image"
import { useState } from "react";


export const DashboardHeader = () => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div className="flex items-center justify-start space-x-3 mb-3 cursor-pointer"
        >
            <Image src="/whitefullname.png" alt="pocket shuttle" width={180} height={80} className="px-2 py-0" />
            {/* <p className="text-xl px-8">PocketShuttle</p> */}
        </div>
    )
}
