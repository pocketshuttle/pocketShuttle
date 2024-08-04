"use client"
import { useRouter } from "next/navigation"
import { MdNotifications } from "react-icons/md"
import LottieAnimation from "../dashboard/sidebar/menuLink/lottie-animation"
import { useState } from "react"
import home from "@/public/images/home.json"

const Navbar = () => {
    const router = useRouter()
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div className="flex justify-between bg-[var(--bg-root)] h-[60px] w-full
        items-center px-4">
            <div className="flex gap-[0.1rem] items-center justify-center cursor-pointer" onClick={() => router.back()}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div
                    className='w-[25px] h-[25px] mr-[0.2rem]'
                >
                    <LottieAnimation isHovering={isHovering} animationData={home} />

                </div>
                <span className="text-lg">
                    Home
                </span>
            </div>

            <div>
                <MdNotifications size={30} />
            </div>

        </div>
    )
}

export default Navbar