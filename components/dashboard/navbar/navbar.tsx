"use client"
import { Input } from "@/components/ui/input"
import { usePathname } from "next/navigation"
import { BiSearch } from "react-icons/bi"
import { MdNotifications, MdOutlineChat } from "react-icons/md"

const Navbar = () => {
    const pathname = usePathname()

    return (
        <div className="w-full h-14 p-2 bg-[#182237] rounded-sm flex justify-between items-center">
            <div >
                <span className="capitalize">
                    {pathname.split('/').pop()}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex justify-center items-center border border-gray-600 gap-2 focus-visible:ring-ring rounded-md ">
                    <BiSearch className="w-4 ml-1" />
                    <Input placeholder="Search..." className=" border-none  outline-none foc focus-visible:outline-none px-0 py-0 focus-visible:ring-0" />
                </div>
                <MdNotifications size={20} />
                <MdOutlineChat size={20} />
            </div>
        </div>
    )
}

export default Navbar