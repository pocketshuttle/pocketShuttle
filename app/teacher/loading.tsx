"use client"
import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

const loading = () => {
    return (
        <div className="flex flex-col w-full items-center space-y-1">
            <div className="flex items-center gap-2 m-auto">
                <DotLottieReact
                    src="/images/parentload.json"
                    loop
                    autoplay
                    style={{ width: 400, height: 400 }}
                />
            </div>
        </div>
    )
}

export default loading
