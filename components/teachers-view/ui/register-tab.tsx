"use client";
import { updateLocation } from "@/actions/mark-otw";
import { updateStudentStatus } from "@/actions/mark-status";
import { updateStudentAttendance } from "@/actions/mart-attendance";
import { toast } from "@/components/ui/use-toast";
import useUpdateAttendance from "@/hooks/usePatch";
import { StudentAttendance, StudentPresence, StudentStatus } from "@/packages/db/client";
import { Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";

type RegisterProps = {
    value1: string
    value2: string;
    label1: string;
    label2: string;
    data: string;
    SetAttendance: Dispatch<SetStateAction<string>>;
    attendance: string;
    id: string;
    eta?: string | null;
    onOTW?: () => void
};

type ActionResult = {
    message: string;
    status: number;
};

export const AttendanceTab = ({
    id, value1, value2, label1, label2, data, SetAttendance, attendance, eta, onOTW
}: RegisterProps) => {
    const [localAttendance, setLocalAttendance] = useState(data);
    const [pendingValue, setPendingValue] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition()
    const { loading, error } = useUpdateAttendance(id, "PATCH");
    const isBusy = loading || isPending;

    useEffect(() => {
        setLocalAttendance(data);
    }, [data]);

    const handleAttendanceClick = async (value: string) => {
        if (isBusy || localAttendance === value) return;
        setPendingValue(value);
        const handleMode = (
            label1 === "Present" || label1 === "Absent"
                ? updateStudentAttendance(id, value as StudentAttendance)
                : label1 === "OTW" || label1 === "Stop"
                    ? updateLocation(id, value as StudentPresence, eta ?? undefined)
                    : updateStudentStatus(id, value as StudentStatus)
        ) as Promise<ActionResult>;

        startTransition(() => {
            handleMode.then((data) => {
                toast({
                    description: data.message,
                });

                if (data.status !== 200) {
                    setPendingValue(null);
                    return;
                }

                setLocalAttendance(value);
                SetAttendance(value);

                if (label1 === "OTW" && value === value1) {
                    onOTW?.()
                }

            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            }).finally(() => {
                setPendingValue(null);
            });
        })
    };

    const buttonClass = (value: string, activeClass: string) => {
        const isActive = localAttendance === value;
        const isButtonPending = pendingValue === value;
        const isDimmedByPending = isBusy && !isButtonPending;

        return [
            "relative flex h-7 min-w-[64px] items-center justify-center overflow-hidden rounded-lg px-2.5 font-medium",
            "transition-all duration-200 ease-out motion-reduce:transition-none",
            "hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/25",
            "disabled:cursor-not-allowed",
            isActive
                ? `${activeClass} font-semibold ring-1 ring-black/5 dark:ring-white/10`
                : "text-black/55 hover:bg-black/5 hover:text-black dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white",
            isButtonPending ? "scale-[0.98] pr-7" : "",
            isDimmedByPending ? "opacity-45" : "",
        ].join(" ");
    };

    const buttonLabel = (label: string, value: string) => (
        <span className={`flex items-center transition-transform duration-200 ${pendingValue === value ? "-translate-x-1" : ""}`}>
            {label}
        </span>
    );

    return (
        <div className={`inline-flex h-9 items-center justify-center rounded-lg border border-black/10 bg-black/[0.03] p-1 text-[0.7rem] text-black/55 transition-all duration-200 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55 ${isBusy ? "scale-[0.99]" : ""}`}>
            <button
                className={buttonClass(value1, "bg-emerald-500 text-white")}
                onClick={() => handleAttendanceClick(value1)}
                disabled={isBusy}
                aria-pressed={localAttendance === value1}
                aria-busy={pendingValue === value1}
            >
                {buttonLabel(label1, value1)}
                {pendingValue === value1 && <Loader2 className="absolute right-1.5 h-3 w-3 animate-spin" aria-hidden="true" />}
            </button>
            <button
                className={buttonClass(value2, "bg-rose-500 text-white")}
                onClick={() => handleAttendanceClick(value2)}
                disabled={isBusy}
                aria-pressed={localAttendance === value2}
                aria-busy={pendingValue === value2}
            >
                {buttonLabel(label2, value2)}
                {pendingValue === value2 && <Loader2 className="absolute right-1.5 h-3 w-3 animate-spin" aria-hidden="true" />}
            </button>
            {error && <span className="text-red-500">{error}</span>}
        </div>
    );
};
