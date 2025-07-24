"use client"
import { Open_Sans } from "next/font/google"
import LottieAnimation from "../sidebar/menuLink/lottie-animation"
import car from "@/public/images/Car.json";
import student from "@/public/images/student.json";
import classroom from "@/public/images/Classroom.json";

import { useState } from "react";

interface DashboardWrapperProps {
    headLabel: string
    total: number
    bgColor: string
    service?: string

}
// color1="#CEE5F3"
// color2="#1B1464"
// color3="#F0F4F8"
// #C3DFF7
// #A4E2F8

const openSans = Open_Sans({ weight: "500", subsets: ["latin"] })
export const DashboardWrapper = ({ headLabel, total, bgColor, service }: DashboardWrapperProps) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    return (
        <div className={`py-3 px-4 text-[#222D37] space-y-4 flex items-center mx-auto justify-between mt-2 rounded-xl shadow hover:bg-[var(--hoverBg)] shadow-xl bg-${`#A4E2F8`} ${openSans.className} `}
            style={{ backgroundColor: bgColor || "#A4E2F8" }}
        >
            <div className=" font-medium text-xl ">
                <p className="text-[1.2rem] font-semibold text-gray-100">
                    {total}
                </p>
                <p className="text-[0.8rem] text-gray-300">
                    {headLabel}
                </p>
            </div>
            <div className="text-[0.8rem] ">
                <div style={{ width: 40, height: 40, backgroundColor: "#040404", borderRadius: "5px", padding: "5px" }} >
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
