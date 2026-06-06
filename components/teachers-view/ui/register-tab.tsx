"use client";
import { updateLocation } from "@/actions/mark-otw";
import { updateStudentStatus } from "@/actions/mark-status";
import { updateStudentAttendance } from "@/actions/mart-attendance";
import { toast } from "@/components/ui/use-toast";
import useUpdateAttendance from "@/hooks/usePatch";
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

export const AttendanceTab = ({
    id, value1, value2, label1, label2, data, SetAttendance, attendance, eta, onOTW
}: RegisterProps) => {
    const [localAttendance, setLocalAttendance] = useState(data);
    const [isPending, startTransition] = useTransition()
    const { loading, error } = useUpdateAttendance(id, "PATCH");

    useEffect(() => {
        setLocalAttendance(data);
    }, [data]);

    const handleAttendanceClick = async (value: string) => {
        if (isPending) return;
        //@ts-ignore
        const handleMode = label1 === "Present" || label1 === "Absent" ? updateStudentAttendance(id, value) : label1 === "OTW" || label1 === "Stop" ? updateLocation(id, value, eta) : updateStudentStatus(id, value)

        startTransition(() => {
            handleMode.then((data) => {
                toast({
                    description: data.message,
                });

                if (data.status !== 200) {
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
            });
        })
    };

    return (
        <div className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-black/[0.03] p-1 text-[0.7rem] text-black/55 shadow-inner dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55">
            <button
                className={`flex h-7 items-center justify-center rounded-lg px-2.5 transition ${localAttendance === value1 ? "bg-emerald-500 text-white shadow-sm font-semibold" : "text-black/55 dark:text-white/55"}`}
                onClick={() => handleAttendanceClick(value1)}
                disabled={loading || isPending}
            >
                {label1}
            </button>
            <button
                className={`flex h-7 items-center justify-center rounded-lg px-2.5 transition ${localAttendance === value2 ? "bg-rose-500 text-white shadow-sm font-semibold" : "text-black/55 dark:text-white/55"}`}
                onClick={() => handleAttendanceClick(value2)}
                disabled={loading || isPending}
            >
                {label2}
            </button>
            {/* @ts-ignore */}
            {error && <span className="text-red-500">{error.message}</span>}
        </div>
    );
};
