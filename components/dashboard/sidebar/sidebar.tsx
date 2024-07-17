"use client"
import { DashboardIcon } from "@radix-ui/react-icons";
import training from "@/public/images/training.svg";
import students from "@/public/images/students.svg";
import commute from "@/public/images/commute.svg";
import revenue from "@/public/images/revenue.svg";
import report from "@/public/images/report.svg";
import settings from "@/public/images/settings.svg";
import headset from "@/public/images/headset.svg";
import dashboard from "@/public/images/dashboard.svg";
import Image from "next/image";
import MenuLink from "./menuLink/menuLink";
import { DashboardHeader } from "../header/header";
import { BiLogOut } from "react-icons/bi";
import { signOut, useSession, } from "next-auth/react"

const Sidebar = () => {
    const menuItems = [
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
                    icon: training,
                },
                {
                    title: "Students",
                    link: "/dashboard/students",
                    icon: students,
                },
                {
                    title: "Commute",
                    link: "/dashboard/commute",
                    icon: commute,
                },
                {
                    title: "Buses",
                    link: "/dashboard/bus",
                    icon: commute,
                },
                {
                    title: "Parent",
                    link: "/dashboard/parent",
                    icon: commute,
                },
            ],
        },
        {
            title: "Analytics",
            list: [
                {
                    title: "Revenue",
                    link: "/dashboard/revenue",
                    icon: revenue,
                },
                {
                    title: "Reports",
                    link: "/dashboard/report",
                    icon: report,
                },
            ],
        },
        {
            title: "User",
            list: [
                {
                    title: "Settings",
                    link: "/settings",
                    icon: settings,
                },
                {
                    title: "Help",
                    link: "/help",
                    icon: headset,
                },
            ],
        },
    ];

    return (
        <div className="h-screen fixed  bg-[var(--bgSoft)] px-2 py-6">
            <DashboardHeader />
            <ul className="w-[250px] space-y-5">
                {menuItems.map((menuSection, index) => (
                    <li key={index}>
                        <span className="text-[#b7cac1] text-[0.8rem]">{menuSection.title}</span>
                        <MenuLink menu={menuSection.list} />
                    </li>
                ))}
                <button className="flex gap-2 items-center text-[0.75rem] py-3 px-2 hover:bg-[#2e374a] w-full rounded-md"
                    onClick={() => signOut()}
                >
                    <BiLogOut />
                    Logout
                </button>
            </ul>
        </div>
    );
};

export default Sidebar;
