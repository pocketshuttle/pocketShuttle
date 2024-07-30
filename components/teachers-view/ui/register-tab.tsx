"use client"
import useUpdateAttendance from "@/hooks/usePatch";
import { usePost } from "@/hooks/usePost";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type RegisterProps = {
    value1: string;
    value2: string;
    label1: string;
    label2: string;
    data: string;
    SetAttendance: Dispatch<SetStateAction<string>>;
    attendance: string;
    id: string
};


export const AttendaceTab = ({ id, value1, value2, label1, label2, data, SetAttendance, attendance }: RegisterProps) => {
    const [localAttendance, setLocalAttendance] = useState(data);
    const { updateAtendance, loading, error } = useUpdateAttendance(id, "PATCH");


    const url = label1 === "Present" || "Absent" ? `/api/addstudent/markattendance/${id}` : `/api/addstudent/markstatus/${id}`
    const handleAttendanceClick = (value: string) => {
        setLocalAttendance(value);
        SetAttendance(value);
        updateAtendance(value, url);
    };

    return (
        <div className="inline-flex text-[0.7rem] h-9 items-center justify-center rounded-lg bg-[var(--bg)] p-1 text-muted-foreground">
            <button
                className={`px-2 rounded-md h-7 items-center flex justify-center ${localAttendance === value1 && "bg-[teal] text-gray-200 font-semibold"}`}
                onClick={() => handleAttendanceClick(value1)}
            >
                {label1}
            </button>
            <button
                className={`px-2 rounded-md h-7 items-center flex justify-center ${localAttendance === value2 && "bg-[crimson] text-gray-200"}`}
                onClick={() => handleAttendanceClick(value2)}
            >
                {label2}
            </button>
        </div>
    );
};
