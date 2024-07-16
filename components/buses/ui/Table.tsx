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
import { useSession } from "next-auth/react"
import { useFetch } from "@/hooks/useFetch"
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
import { deleteItem } from "@/lib/utils"


type BusProps = {
    _id: string,
    shchool_id: string,
    bus_product_name: string,
    color: string,
    seat_number: string,
    driver: string,
    bus_number: string,
    student: string
    teacher: string
}

export const BusData = () => {
    const [isOpenModal, setIsOpenModal] = useState(false)
    const { data: session } = useSession()
    const userId = session?.user?.id
    const { data: busData, isPending, errorMessage } = useFetch(`/api/addbus/${userId}`, userId);

    if (isPending) {
        return <p>Loading...</p>;
    }

    if (errorMessage) {
        return <p>Error: {errorMessage}</p>;
    }

    console.log(busData)

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

            <Table>
                <TableHeader>
                    <TableRow className=" text-[0.7rem]">
                        <TableHead className=" text-gray-300">Bus Name</TableHead>
                        <TableHead className=" text-gray-300">Bus Number</TableHead>
                        <TableHead className=" text-gray-300">Bus Color</TableHead>
                        <TableHead className="text-gray-300">Number of Seats</TableHead>
                        <TableHead className="w-[150px] text-gray-300">Driver</TableHead>
                        <TableHead className="w-[150px] text-gray-300">Teacher</TableHead>
                        <TableHead className="text-gray-300">Students</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-[0.75rem] text-gray-400 ">
                    {busData?.map((bus: BusProps) => {
                        return (
                            <TableRow key={bus._id}>
                                <TableCell className="capitalize">
                                    {bus.bus_product_name}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.bus_number}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.color}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.seat_number}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.driver}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.teacher}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.student}
                                </TableCell>
                                <TableCell>
                                    <div className="space-x-2">
                                        <Link href={`/dashboard/bus/${bus._id}`}>
                                            <button className="bg-[teal] px-2 text-[0.5rem] rounded-sm">
                                                view
                                            </button>
                                        </Link>
                                        <button className="bg-destructive px-2 text-[0.5rem] rounded-sm"
                                            onClick={() => deleteItem(busData, bus._id)}
                                        >
                                            delete
                                        </button>
                                    </div>
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
