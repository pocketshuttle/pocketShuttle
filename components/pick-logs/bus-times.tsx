"use client"
import { Open_Sans } from "next/font/google"
import { useState } from "react";

interface AveragePickUpProps {
    headLabel: string
    avgTime: string
    service?: string

}
const openSans = Open_Sans({ weight: "500", subsets: ["latin"] })

export const AveragePickUp = ({ headLabel, avgTime, service }: AveragePickUpProps) => {
    return (
        <div className={`py-5 px-2 border border-gray-600 text-[#222D37] space-y-4 flex  justify-between mt-2 rounded-xl hover:bg-[var(--hoverBg)] shadow-xl  ${openSans.className} `}
        >
            <div className=" font-normal text-xl space-y-3 ">
                <p className="text-lg text-gray-300">
                    {headLabel}
                </p>
                <p className="text-4xl font-semibold text-gray-100">
                    {avgTime ?? "00 AM"}
                </p>
            </div>
        </div>
    )
}