import { cn } from "@/lib/utils";

interface HeaderProps {
    label: string
    subtitle?: string
}

export const AuthHeader = ({ label, subtitle }: HeaderProps) => {
    return (
        <div className="w-full text-center text-slate-950">
            <h1
                className={cn("text-3xl font-semibold sm:text-[2rem]")}
            >
                {label}
            </h1>
        </div>
    )
}
