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

