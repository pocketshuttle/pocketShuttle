"use client"

import { logout } from "@/actions/logout";
import { ExitIcon } from "@radix-ui/react-icons";

const Logout = () => {
    const handleLogout = async () => {
        const callbackUrl = window.location.pathname;
        await logout(callbackUrl);
    };

    return (
        <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg bg-black/5 px-3 py-3 text-sm font-semibold text-black transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            onClick={handleLogout}
        >
            <ExitIcon className="h-4 w-4" />
        </button>
    )
}

export default Logout
