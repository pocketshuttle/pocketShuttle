import { cn } from "@/lib/utils";

interface HeaderProps {
    label: string
    subtitle?: string
}

export const AuthHeader = ({ label, subtitle }: HeaderProps) => {
    return (
        <div className="w-full space-y-4 text-center text-slate-950">
            <div className="mx-auto inline-flex px-3 py-1 text-[0.68rem] font-semibold uppercase text-blue-700">
                PocketShuttle
            </div>
            <h1
                className={cn("text-3xl font-semibold sm:text-[2rem]")}
            >
                {label}
            </h1>
            {subtitle && (
                <p className="mx-auto max-w-md text-sm leading-6 text-slate-600">
                    {subtitle}
                </p>
            )}
        </div>
    )
}
