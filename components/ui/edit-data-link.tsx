import React, { useState } from 'react'
import LottieAnimation from '../dashboard/sidebar/menuLink/lottie-animation'
import { Button } from './button';
import plus from "@/public/images/plus.json"
import edit from "@/public/images/edit.json"
import deleted from "@/public/images/delete.json"
import Link from 'next/link';

type ButtonProps = {
    link: string
    mode: string
}
export const EditData = ({ link, mode }: ButtonProps) => {
    const [isHovering, setIsHovering] = useState(false);
    const icon = mode === "edit" ? edit : deleted

    return (
        <div>
            <Link href={`${link}`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div
                    className='w-[20px] h-[20px] mr-[0.2rem]'
                >
                    <LottieAnimation isHovering={isHovering} animationData={icon} />
                </div>
            </Link>
        </div>
    )
}

