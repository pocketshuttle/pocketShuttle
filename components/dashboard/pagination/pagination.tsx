import React from 'react'

export const Pagination = () => {
    return (
        <div className="space-x-2 flex justify-between w-full px-6 py-3 ">
            <button className="text-[0.7rem] bg-gray-400 px-2 py-[0.2rem] rounded-sm text-gray-600 cursor-pointer" disabled >
                previous
            </button>
            <button className="text-[0.7rem] bg-gray-200 px-2 py-[0.2rem] rounded-sm text-gray-900 cursor-pointer">
                next
            </button>
        </div>
    )
}
