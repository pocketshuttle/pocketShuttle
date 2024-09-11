"use client";

import settings from "@/public/images/setting.json";
import MenuLink from "./menuLink/menuLink";
import { DashboardHeader } from "../header/header";
import { BiLogOut } from "react-icons/bi";
import { signOut, useSession } from "next-auth/react";
import classroom from "@/public/images/Classroom.json";
import parent from "@/public/images/parent.json";
import student from "@/public/images/student.json";
import report from "@/public/images/Report.json";
import support from "@/public/images/support.json";
import dashboard from "@/public/images/dashboard.json";
import car from "@/public/images/Car.json";
import analytics from "@/public/images/analytics.json";
import exit from "@/public/images/exit.json";
import LottieAnimation from "./menuLink/lottie-animation";
import { useState } from "react";
import userprofile from "@/public/images/userProfile.json";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

type ListType = {
    link: string;
    icon: any;
    title: string;
};

const Sidebar = ({ data }: any) => {
    const [isHovering, setIsHovering] = useState(false);

    const menuItems: { title: string; list: ListType[] }[] = [
        {
            title: "Pages",
            list: [
                {
                    title: "Dashboard",
                    link: "/dashboard",
                    icon: dashboard,
                },
                {
                    title: "Teachers",
                    link: "/dashboard/teachers",
                    icon: classroom,
                },
                {
                    title: "Students",
                    link: "/dashboard/students",
                    icon: student,
                },
                {
                    title: "Commute",
                    link: "/dashboard/commute",
                    icon: car,
                },
                {
                    title: "Buses",
                    link: "/dashboard/bus",
                    icon: car,
                },
                {
                    title: "Parent",
                    link: "/dashboard/parent",
                    icon: parent,
                },
                {
                    title: "Revenue",
                    link: "/dashboard/revenue",
                    icon: analytics,
                },
                {
                    title: "Reports",
                    link: "/dashboard/report",
                    icon: report,
                },
                {
                    title: "Settings",
                    link: "/settings",
                    icon: settings,
                },
                {
                    title: "Help",
                    link: "/help",
                    icon: support,
                },
            ],
        },
    ];

    return (
        <div className="h-screen fixed flex flex-col justify-between bg-[var(--bg-root)] px-2 py-6 border-1 border-r-[1px] border-gray-600">
            <div className="space-y-7">
                <DashboardHeader />
                <ul className="w-[300px]">
                    {menuItems.map((menuSection, index) => (
                        <li key={index}>
                            {/* <span className="text-[#b7cac1] text-[0.8rem]">{menuSection.title}</span> */}
                            <MenuLink menu={menuSection.list} />
                        </li>
                    ))}
                </ul>
            </div>

            <button
                className="flex gap-2 flex-start text-[0.9rem] py-3 px-2 hover:bg-[var(--hoverBg)] w-full rounded-md"
                onClick={() => signOut()}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <Avatar>
                    {data?.image ? (
                        <AvatarImage src={data?.image} alt="@shadcn" />
                    ) : (
                        <div style={{ width: 40, height: 40 }}>
                            <LottieAnimation isHovering={isHovering} animationData={userprofile} />
                        </div>
                    )}
                </Avatar>
                <div className="flex flex-col items-start ">
                    <span className="text-[1rem] font-medium capitalize">{data?.name || "admin"}</span>
                    <span className="text-[0.7rem] text-[#b7cac1]">{data?.role || "admffin"}</span>
                </div>
            </button>
        </div>
    );
};

export default Sidebar;
