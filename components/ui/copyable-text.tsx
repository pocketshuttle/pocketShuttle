"use client";

import { toast } from "@/components/ui/use-toast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type CopyableTextProps = {
    label: string;
    value?: string | number | null;
    fallback?: string;
    className?: string;
    truncateClassName?: string;
};

export const CopyableText = ({
    label,
    value,
    fallback = "Not available",
    className = "",
    truncateClassName = "max-w-[220px]",
}: CopyableTextProps) => {
    const displayValue = value ? String(value) : fallback;

    const handleCopy = async () => {
        if (!value) {
            toast({ description: `${label} is not available` });
            return;
        }

        try {
            await navigator.clipboard.writeText(String(value));
            toast({ description: `${label} copied` });
        } catch {
            toast({ description: `Unable to copy ${label.toLowerCase()}` });
        }
    };

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={`block truncate text-left transition-colors hover:text-black dark:hover:text-white ${truncateClassName} ${className}`}
                        aria-label={`Copy ${label.toLowerCase()}`}
                    >
                        {displayValue}
                    </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[320px] bg-black text-white dark:bg-white dark:text-black">
                    {displayValue}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
