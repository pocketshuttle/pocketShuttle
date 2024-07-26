import Image from 'next/image'
import React from 'react'
import spinner from "@/public/images/spinner.gif"

export const Spinner = () => {
    return <div className="flex items-center justify-center">
        < Image src={spinner} alt="loading" />
    </div>
}
