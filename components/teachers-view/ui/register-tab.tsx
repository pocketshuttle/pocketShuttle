"use client";
import useUpdateAttendance from "@/hooks/usePatch";
import { Dispatch, SetStateAction, useState } from "react";

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
    const { updateAtendance, loading, error } = useUpdateAttendance(id, "PATCH");


    const url =
        label1 === "Present" || label1 === "Absent"
            ? `/api/addstudent/markattendance/${id}`
            : label1 === "Dropped" || label1 === "Picked"
                ? `/api/addstudent/markstatus/${id}`
                : "";

    const handleAttendanceClick = async (value: string) => {
        setLocalAttendance(value);
        SetAttendance(value);

        await updateAtendance(value, url);
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
