"use client";
import { updateStudentStatus } from "@/actions/mark-status";
import { updateStudentAttendance } from "@/actions/mart-attendance";
import revalidateStudent from "@/actions/validation/revalidate-student";
import { toast } from "@/components/ui/use-toast";
import useUpdateAttendance from "@/hooks/usePatch";
import { StudentStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useTransition } from "react";

type RegisterProps = {
    value1: string;
    value2: string;
    label1: string;
    label2: string;
    data: string;
    SetAttendance: Dispatch<SetStateAction<string>>;
    attendance: string;
    id: string;
};

export const AttendanceTab = ({
    id, value1, value2, label1, label2, data, SetAttendance, attendance
}: RegisterProps) => {
    const [localAttendance, setLocalAttendance] = useState(data);
    const [isPending, startTransition] = useTransition()
    const { updateAtendance, loading, error } = useUpdateAttendance(id, "PATCH");



    // const url =
    //     label1 === "Present" || label1 === "Absent"
    //         ? `/api/addstudent/markattendance/${id}`
    //         : label1 === "Dropped" || label1 === "Picked"
    //             ? `/api/addstudent/markstatus/${id}`
    //             : "";

    const handleAttendanceClick = async (value: string) => {
        //@ts-ignore
        const handleMode = label1 === "Present" || label1 === "Absent" ? updateStudentAttendance(id, value) : updateStudentStatus(id, value)

        setLocalAttendance(value);
        SetAttendance(value);

        startTransition(() => {
            handleMode.then((data) => {
                toast({
                    description: data.message,
                });
                revalidateStudent("collection")
                // window.location.reload();
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    };

    return (
        <div className="inline-flex text-[0.7rem] h-9 items-center justify-center rounded-lg bg-[var(--bg)] p-1 text-muted-foreground">
            <button
                className={`px-2 rounded-md h-7 items-center flex justify-center ${localAttendance === value1 ? "bg-[teal] text-gray-200 font-semibold" : ""}`}
                onClick={() => handleAttendanceClick(value1)}
                disabled={loading}
            >
                {label1}
            </button>
            <button
                className={`px-2 rounded-md h-7 items-center flex justify-center ${localAttendance === value2 ? "bg-[crimson] text-gray-200" : ""}`}
                onClick={() => handleAttendanceClick(value2)}
                disabled={loading}
            >
                {label2}
            </button>
            {/* @ts-ignore */}
            {error && <span className="text-red-500">{error.message}</span>}
        </div>
    );
};
