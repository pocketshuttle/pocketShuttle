"use client"
import { Input } from "@/components/ui/input"
import { useFetch } from "@/hooks/useFetch"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { BiSearch } from "react-icons/bi"
import { MdNotifications, MdOutlineChat } from "react-icons/md"
import { Search } from "../search/search"

const Navbar = () => {
    const pathname = usePathname()
    const { data: session } = useSession()
    const userId = session?.user?.id

    return (
        <div className="w-full h-14 p-2 bg-[#182237] rounded-sm flex justify-between items-center">
            <div >
                <span className="capitalize">
                    {pathname.split('/').pop()}
                </span>
            </div>
            <div className="flex items-center gap-2 w-3/6">
                <div className="flex justify-center items-center border border-gray-600 gap-2 focus-visible:ring-ring rounded-md w-full">
                    <BiSearch className="w-6 h-6 ml-1 p-0 text-gray-600" />
                    <Search placeholder={`Search ${pathname.split('/').pop()} full name...`} classname=" outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 border-0" />
                </div>

                <MdNotifications size={20} />
                <MdOutlineChat size={20} />
            </div>
        </div>
    )
}

export default Navbar