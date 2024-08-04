"use client"

import { Button } from "@/components/ui/button"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { ChevronRightIcon, ChevronLeftIcon } from "@radix-ui/react-icons"
import { useState } from "react"
import LottieAnimation from "../sidebar/menuLink/lottie-animation"
import arrow from "@/public/images/Arrow.json"
import left from "@/public/images/left.json"
type CountProps = {
    count: number
    pageCount: number
}
export const Pagination = ({ count, pageCount }: CountProps) => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()
    const params = new URLSearchParams(searchParams)
    const [isHovering, setIsHovering] = useState(false);

    const page: number = searchParams.get("page") as unknown as number || 1
    const ITEM_PER_PAGE = pageCount

    //this function returns 0, meaning the back button is disabled for the first page
    //the second page returns 1, so the button is enabled
    const hasPrev = ITEM_PER_PAGE * (parseInt(page) - 1) > 0

    const hasNext = ITEM_PER_PAGE * (parseInt(page) - 1) + ITEM_PER_PAGE < count;

    const handlePagination = (type: string) => {
        type === "prev" ? params.set("page", parseInt(page) - 1) : params.set("page", parseInt(page) + 1)
        replace(`${pathname}?${params}`)
    }

    return (
        <div className="flex justify-between  items-center w-full">
            <span className="text-md text-gray-400">
                Page {parseInt(page)} {Math.round(count / ITEM_PER_PAGE) < 1 ? "" :
                    <>
                        of {Math.round(count / ITEM_PER_PAGE)}
                    </>

                }
            </span>
            <div className="space-x-2 flex justify-between  px-6 py-3 ">
                <Button variant="outline" disabled={!hasPrev} onClick={() => handlePagination("prev")} className="bg-transparent border-gray-600 hover:bg-[var(--hoverBg)] "
                >
                    <div
                        className='w-[20px] h-[20px]'
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <LottieAnimation isHovering={isHovering} animationData={left} />
                    </div>
                </Button>
                <Button variant="outline" disabled={!hasNext} onClick={() => handlePagination("next")} className="bg-transparent border-gray-600 hover:bg-[var(--hoverBg)] ">


                    <div
                        className='w-[20px] h-[20px]'
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <LottieAnimation isHovering={isHovering} animationData={arrow} />
                    </div>
                </Button>
            </div >
        </div>

    )
}
