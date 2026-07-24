"use client";

import settings from "@/public/images/setting.json";
import MenuLink from "./menuLink/menuLink";
import classroom from "@/public/images/Classroom.json";
import parent from "@/public/images/parent.json";
import student from "@/public/images/student.json";
import report from "@/public/images/Report.json";
import support from "@/public/images/support.json";
import dashboard from "@/public/images/dashboard.json";
import car from "@/public/images/Car.json";
import analytics from "@/public/images/analytics.json";
import location from "@/public/images/location.json";
import Logout from "./logout";

type ListType = {
    link: string;
    icon: any;
    title: string;
};

const Sidebar = ({ data }: any) => {
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
                    title: "Parent",
                    link: "/dashboard/parent",
                    icon: parent,
                },

                {
                    title: "Map",
                    link: "/dashboard/map",
                    icon: location,
                },
                {
                    title: "Buses",
                    link: "/dashboard/bus",
                    icon: car,
                },
                {
                    title: "Revenue",
                    link: "/dashboard/revenue",
                    icon: analytics,
                },
                {
                    title: "Billing",
                    link: "/dashboard/billing",
                    icon: analytics,
                },

                {
                    title: "Reports",
                    link: "/dashboard/report",
                    icon: report,
                },
                {
                    title: "Settings",
                    link: "/dashboard/settings",
                    icon: settings,
                },
                {
                    title: "Help",
                    link: "/dashboard/help",
                    icon: support,
                },
            ],
        },
    ];

    return (
        <aside className="flex h-full w-[168px] flex-col justify-between bg-white px-3 py-5 text-black transition-colors duration-200 dark:bg-black dark:text-white lg:w-[280px]">
            <div className="space-y-2">
                <ul className="w-full">
                    {menuItems.map((menuSection, index) => (
                        <li key={index}>
                            <MenuLink menu={menuSection.list} />
                        </li>
                    ))}

                </ul>

            </div>

            <Logout />
        </aside>
    );
};

export default Sidebar;
