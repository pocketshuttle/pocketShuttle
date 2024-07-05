"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

type ListType = {
    link: string
    icon: string
    title: string
}

const MenuLink = ({ menu }: { menu: ListType[] }) => {
    const pathname = usePathname()
    return (
        <div className="w-full" >
            {menu.map((item: ListType, index: any) => (
                <Link href={item.link} key={index} >
                    <div className={`flex items-center space-x-2  p-3 hover:bg-[#2e374a] ${pathname === item.title && "bg-red-500"}`}>
                        <Image src={item.icon} alt={item.title} className="w-3" />
                        <span className="text-[0.7rem]">{item.title}</span>
                    </div>
                </Link>
            ))}


        </div>
    )
}

export default MenuLink