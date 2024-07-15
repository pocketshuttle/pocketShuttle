"use client"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useState } from "react"
import { StudentModal } from "@/components/students/ui/Student-modal"
import Link from "next/link"
import { BusModal } from "./bus-modal"

export const BusData = () => {
    const [isOpenModal, setIsOpenModal] = useState(false)


    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237] mt-2">
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for Buses..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <Button variant="secondary" onClick={() => setIsOpenModal(true)}>
                    add new
                </Button>
            </div>
            {
                isOpenModal && <BusModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-300 capitalize  ">
                    <tr >
                        <th scope="col" className="px-6 py-3" rowSpan={6}>
                            Bus Number
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Driver
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Number of Seats
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Teacher
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Students
                        </th>

                    </tr>
                </thead>
                <tbody>
                    <tr className="dark:bg-gray-800  hover:bg-gray-900 cursor-pointer text-[var(--textSoft)] text-[0.8rem]">

                        <td className="px-6 py-4" rowSpan={8}>
                            John Doe
                        </td>
                        <td className="px-6 py-4 bg-crimson">
                            7
                        </td>
                        <td className="px-6 py-4  ">
                            ongoing

                        </td>
                        <td className="px-6 py-4 ">
                            12/20/2024
                        </td>
                        <td className="px-6 py-4">
                            000/20/2024
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-x-2">
                                <Link href="/dashboard/bus/idie">
                                    <button className="bg-[teal] px-2 text-[0.5rem] rounded-sm">
                                        view
                                    </button>
                                </Link>
                                <Link href="/dashboard">
                                    <button className="bg-destructive px-2 text-[0.5rem] rounded-sm">
                                        delete
                                    </button>
                                </Link>
                            </div>
                        </td>


                    </tr>

                </tbody>
            </table>
            <Pagination />
        </div >

    )
}
