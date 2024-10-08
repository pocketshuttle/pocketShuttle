import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

const loading = () => {
    return (
        <div className="flex flex-col w-full items-center space-y-1">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-5/6" />
            <div className="space-y-2">
                <Skeleton className="h-[105px] w-5/6 rounded-xl" />
            </div>
        </div>
    )
}

export default loading
