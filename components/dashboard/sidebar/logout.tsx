"use client"

import { logout } from "@/actions/logout";
import { ExitIcon } from "@radix-ui/react-icons";
import Image from "next/image";


const Logout = () => {
    const handleLogout = async () => {
        await logout();
    };
    return (
        <button className="py-2 flex justify-start items-center text-md bg-[crimson] rounded-sm px-2"
            onClick={handleLogout}
        >
            <ExitIcon className=" mr-2" />
            logout
        </button>
    )
}

export default Logout