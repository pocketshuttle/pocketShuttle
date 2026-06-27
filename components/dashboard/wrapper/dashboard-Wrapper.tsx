"use client"
import LottieAnimation from "../sidebar/menuLink/lottie-animation"
import car from "@/public/images/Car.json";
import student from "@/public/images/student.json";
import classroom from "@/public/images/Classroom.json";

import { useState } from "react";

interface DashboardWrapperProps {
    headLabel: string
    total: number
    bgColor?: string
    service?: string

}
export const DashboardWrapper = ({ headLabel, total, bgColor, service }: DashboardWrapperProps) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    return (
        <div className="mx-auto mt-2 flex items-center justify-between space-y-4 rounded-xl border border-[var(--text)] bg-[var(--bgSoft)] px-4 py-3 text-[var(--text)] transition-colors hover:bg-[var(--hoverBg)]"
            style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
            <div className=" font-medium text-xl ">
                <p className="text-[1.2rem] font-semibold text-[var(--text)]">
                    {total}
                </p>
                <p className="text-[0.8rem] text-[var(--textSoft)]">
                    {headLabel}
                </p>
            </div>
            <div className="text-[0.8rem] ">
                <div className="h-10 w-10 rounded-md border border-[var(--text)] bg-[var(--bg-root)] p-1" >
                    {
                        service === "student" ?
                            <LottieAnimation
                                isHovering={hoverIndex === 0}
                                animationData={student}
                            />
                            :
                            service === "bus" ?
                                <LottieAnimation
                                    isHovering={hoverIndex === 1}
                                    animationData={car}
                                />
                                :
                                <LottieAnimation
                                    isHovering={hoverIndex === 2}
                                    animationData={classroom}
                                />
                    }

                </div>
            </div>

        </div>
    )
}
