"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LottieAnimation from "./lottie-animation";
import classroom from "@/public/images/Classroom.json"
type ListType = {
    link: string;
    icon: string;
    title: string;
};

const MenuLink = ({ menu }: { menu: ListType[] }) => {
    const pathname = usePathname();
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    return (
        <div className="w-full">
            {menu.map((item: ListType, index: number) => (
                <Link href={item.link} key={index}>
                    <div
                        className={`flex items-center space-x-2 px-2 py-3 hover:bg-[var(--hoverBg)] mb-1 rounded-md ${pathname === item.link && "bg-[var(--hoverBg)]"
                            }`}
                        onMouseEnter={() => setHoverIndex(index)}
                        onMouseLeave={() => setHoverIndex(null)}
                    >
                        {/* <Image src={item.icon} alt={item.title} className="w-3" /> */}
                        <div style={{ width: 23, height: 23 }}>
                            <LottieAnimation
                                isHovering={hoverIndex === index}
                                animationData={item.icon}
                            />
                        </div>
                        <span className="text-[0.8rem]">{item.title}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default MenuLink;
