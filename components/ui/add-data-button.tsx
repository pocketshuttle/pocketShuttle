import React, { useState } from 'react'
import LottieAnimation from '../dashboard/sidebar/menuLink/lottie-animation'
import { Button } from './button';
import plus from "@/public/images/plus.json"

type ButtonProps = {
    action: () => void
    label: string
}
export const AddData = ({ action, label }: ButtonProps) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div>
            <Button variant="secondary" onClick={action}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="h-10 rounded-lg bg-[#4a48ff] px-4 font-medium text-white shadow-none transition-transform duration-150 hover:scale-[1.02] hover:bg-[#5b5aff]"
            >
                <div
                    className='w-[23px] h-[23px] mr-[0.2rem]'
                >
                    <LottieAnimation isHovering={isHovering} animationData={plus} />
                </div>
                {label}
            </Button>
        </div>
    )
}
