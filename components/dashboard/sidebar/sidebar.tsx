import { DashboardIcon } from "@radix-ui/react-icons"
import training from "@/public/images/training.svg"
import students from "@/public/images/students.svg"
import commute from "@/public/images/commute.svg"
import revenue from "@/public/images/revenue.svg"
import report from "@/public/images/report.svg"
import settings from "@/public/images/settings.svg"
import headset from "@/public/images/headset.svg"
import dashbaord from "@/public/images/dashboard.svg"
import Image from "next/image"
import MenuLink from "./menuLink/menuLink"
const Sidebar = () => {
    const menuItems = [

        {
            title: "Pages",
            list: [
                {
                    title: "Dashboard",
                    link: "/dashboard",
                    icon: dashbaord

                },
                {
                    title: "Teachers",
                    link: "/dashboard/teachers",
                    icon: training
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
                }
            ]
        }, {
            title: "Analytics",
            list: [
                {
                    title: "Revenue",
                    link: "/dashboard/revenue",
                    icon: revenue
                },
                {
                    title: "Reports",
                    link: "/dashboard/report",
                    icon: report
                }
            ]
        }, {
            title: "User",
            list: [
                {
                    title: "Settings",
                    link: "/settings",
                    icon: settings
                },
                {
                    title: "Help",
                    link: "/help",
                    icon: headset
                }
            ]
        }
    ]

    return (
        <div className="h-screen fixed ">
            <ul>
                {menuItems.map((menus, index) => (
                    <li key={index} className="space-y-5">
                        <span className="space-y-5">{menus.title}</span>
                        <MenuLink menu={menus.list} />
                    </li>
                ))}
            </ul>

        </div>
    )
}

export default Sidebar