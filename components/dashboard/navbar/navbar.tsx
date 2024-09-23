"use client"
import { Input } from "@/components/ui/input"
import { useFetch } from "@/hooks/useFetch"
import { usePathname } from "next/navigation"
import { BiSearch } from "react-icons/bi"
import { MdNotifications, MdOutlineChat } from "react-icons/md"
import { Search } from "../search/search"
import LottieAnimation from "../sidebar/menuLink/lottie-animation"
import search from "@/public/images/search.json"
import { useState } from "react"

const Navbar = () => {
    const pathname = usePathname()

    const [isHovering, setIsHovering] = useState(false);


    return (
        <div className="w-full h-14 py-8 bg-[var(--bgRoot)] rounded-sm flex justify-between items-center border-1 border-b-[1px] border-gray-600">
            <div >
                {/* <span className="capitalize text-2xl">
                    {pathname.split('/').pop()}
                </span> */}
            </div>
            <div className="flex items-center gap-2 w-3/6">
                <div className="flex justify-center items-center border border-gray-600 gap-2 focus-visible:ring-ring rounded-md w-full"
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={() => setIsHovering(true)}
                >

                    <div style={{ width: 25, height: 25, color: "#000" }}>
                        <LottieAnimation isHovering={isHovering} animationData={search} />
                    </div>

                    <Search placeholder={`Search ${pathname.split('/').pop()} full name...`} classname=" outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 border-0" />
                </div>

                <MdNotifications size={20} />
                <MdOutlineChat size={20} />
            </div>
        </div>
    )
}

export default Navbar