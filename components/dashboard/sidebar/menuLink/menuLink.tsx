"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LottieAnimation from "./lottie-animation";

type ListType = {
    link: string;
    icon: any;
    title: string;
};

const MenuLink = ({ menu }: { menu: ListType[] }) => {
    const pathname = usePathname();
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    return (
        <nav className="w-full space-y-1">
            {menu.map((item: ListType, index: number) => {
                const isActive =
                    pathname === item.link ||
                    (item.link !== "/dashboard" && pathname.startsWith(`${item.link}/`));

                return (
                <Link href={item.link} key={item.link} prefetch>
                    <div
                        className={`
                            group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium
                            transition-colors duration-200
                            ${isActive
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : "text-black/75 hover:bg-black/5 hover:text-black dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
                            }`}
                        onMouseEnter={() => setHoverIndex(index)}
                        onMouseLeave={() => setHoverIndex(null)}
                        aria-current={isActive ? "page" : undefined}
                    >
                        <span
                            className={`absolute left-0 top-2 h-8 w-1 rounded-r-full transition-colors duration-200 ${isActive ? "bg-white dark:bg-black" : "bg-transparent"
                                }`}
                        />
                        <div className={`grid h-8 w-8 place-items-center rounded-md transition-colors duration-200 ${isActive ? "bg-transparent" : "bg-transparent group-hover:bg-black/5 dark:group-hover:bg-white/10"
                            }`}>
                            <LottieAnimation
                                isHovering={hoverIndex === index || isActive}
                                animationData={item.icon}
                            />
                        </div>
                        <span className={`tracking-normal ${isActive ? "font-semibold text-white dark:text-black" : ""}`}>
                            {item.title}
                        </span>
                    </div>
                </Link>
            )})}

        </nav>
    );
};

export default MenuLink;
