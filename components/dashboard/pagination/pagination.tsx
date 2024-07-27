"use client"

import { usePathname, useSearchParams, useRouter } from "next/navigation"
type CountProps = {
    count: number
}
export const Pagination = ({ count }: CountProps) => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()
    const params = new URLSearchParams(searchParams)

    const page = searchParams.get("page") || 1
    const ITEM_PER_PAGE = 2

    //this function returns 0, meaning the back button is disabled for the first page
    //the second page returns 1, so the button is enabled
    const hasPrev = ITEM_PER_PAGE * (parseInt(page) - 1) > 0

    const hasNext = ITEM_PER_PAGE * (parseInt(page) - 1) + ITEM_PER_PAGE < count;

    const handlePagination = (type: string) => {
        type === "prev" ? params.set("page", parseInt(page) - 1) : params.set("page", parseInt(page) + 1)
        replace(`${pathname}?${params}`)
    }

    return (
        <div className="space-x-2 flex justify-between w-full px-6 py-3 ">
            <button className="text-[0.7rem] bg-gray-200  px-2 py-[0.2rem] rounded-sm text-gray-900 cursor-pointer" disabled={!hasPrev} onClick={() => handlePagination("prev")}>
                previous
            </button>
            <button className="text-[0.7rem] bg-gray-200 px-2 py-[0.2rem] rounded-sm text-gray-900 cursor-pointer" disabled={!hasNext} onClick={() => handlePagination("next")}>
                next
            </button>
        </div>
    )
}
