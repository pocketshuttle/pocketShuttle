"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Mode = "light" | "dark";

export const ModeSwitch = () => {
    const [mode, setMode] = useState<Mode>("dark");

    useEffect(() => {
        const stored = window.localStorage.getItem("theme-mode") as Mode | null;
        const nextMode = stored === "light" || stored === "dark" ? stored : "dark";
        setMode(nextMode);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(nextMode);
    }, []);

    const toggleMode = () => {
        const nextMode = mode === "dark" ? "light" : "dark";
        setMode(nextMode);
        window.localStorage.setItem("theme-mode", nextMode);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(nextMode);
    };

    return (
        <button
            type="button"
            onClick={toggleMode}
            className="grid h-12 w-12 place-items-center rounded-full bg-black/5 text-black transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        >
            {mode === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
    );
};
