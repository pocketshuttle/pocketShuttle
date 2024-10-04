"use client"

import { logout } from "@/actions/logout";
import { ExitIcon } from "@radix-ui/react-icons";



const Logout = () => {
    const handleLogout = async () => {
        const callbackUrl = window.location.pathname;
        await logout(callbackUrl);
    };
    ``
    return (
        <button className="py-2 flex justify-start items-center text-md bg-[crimson] rounded-sm px-2"
            onClick={handleLogout}
        >
            <ExitIcon className=" mr-2" />
           
        </button>
    )
}

export default Logout