"use client"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import Link from "next/link"
import { useFetch } from "@/hooks/useFetch"
import { useSession } from "next-auth/react"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ViewStudent } from "@/components/students/ui/view-student-wrapper"


type BusProps = {
    _id: string,
    shchool_id: string,
    bus_product_name: string,
    color: string,
    seat_number: string,
    driver: string,
    bus_number: string,
    student: string,
    teacher: string,
    route: string,
    status: string
}

export const CommuteTable = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const router = useRouter()
    const { data: busData, isPending, errorMessage } = useFetch(`/api/addbus/${userId}`, userId);

    console.log(busData)

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237] mt-4">
            <Table>
                <TableHeader>
                    <TableRow className=" text-[0.7rem] ">
                        <TableHead className="w-[250px] text-gray-300">Bus No</TableHead>
                        <TableHead className="text-gray-300">Route</TableHead>
                        <TableHead className="text-gray-300">Teacher</TableHead>
                        <TableHead className="text-gray-300">Driver</TableHead>
                        <TableHead className="text-gray-300">No of Kids</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-[0.75rem] text-gray-400 ">
                    {busData?.map((bus: BusProps) => {
                        return (
                            <TableRow key={bus._id}>
                                <TableCell className="text-[0.7rem] capitalize">
                                    <span>{bus.color} </span>
                                    {bus.bus_product_name || "No Bus"}
                                    <span> ({bus.bus_number})</span>
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.bus_number}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.teacher}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.driver}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.student?.length ? <ViewStudent /> : "no kids"}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-[0.2rem] rounded-md text-gray-300  ${bus.status === "parked" ? "bg-[teal]" : "bg-[crimson]"}`}>
                                        {bus.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        )
                    })}

                </TableBody>


            </Table>

            <Pagination />
        </div >

    )
}
