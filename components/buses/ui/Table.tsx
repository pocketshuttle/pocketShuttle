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
import { ViewStudent } from "@/components/students/ui/view-student-wrapper"
import RoutesModal from "./routes-modal"
import { BusProps } from "@/types"
import { Spinner } from "@/components/ui/spinner"




export const BusData = () => {
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isOpenRouteModal, setIsRouteOpenModal] = useState(false)
    const { data: session } = useSession()
    const userId = session?.user?.id
    const { data: busData, isPending, errorMessage } = useFetch(`/api/addbus/${userId}`, userId);

    if (isPending) {
        return <Spinner />
    }

    if (errorMessage) {
        return <p>Error: {errorMessage}</p>;
    }

    console.log(busData)

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237] mt-2">
            <div className="p-4 flex justify-end items-center ">
                <div className="space-x-2">
                    <Button variant="secondary" onClick={() => setIsOpenModal(true)}>
                        add new
                    </Button>

                    <Button variant="destructive" onClick={() => setIsRouteOpenModal(true)}>
                        add bus routes
                    </Button>
                </div>
            </div>
            {
                isOpenModal && <BusModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }
            {
                isOpenRouteModal && <RoutesModal isOpenModal={isOpenRouteModal} setIsOpenModal={setIsRouteOpenModal} />
            }


            <Table>
                <TableHeader>
                    <TableRow className=" text-[0.7rem]">
                        <TableHead className=" text-gray-300">Bus Name</TableHead>
                        <TableHead className=" text-gray-300">Bus Number</TableHead>
                        <TableHead className=" text-gray-300">Bus Color</TableHead>
                        <TableHead className="text-gray-300">Seats</TableHead>
                        <TableHead className="w-[150px] text-gray-300">Driver</TableHead>
                        <TableHead className="w-[150px] text-gray-300">Teacher</TableHead>
                        <TableHead className="text-gray-300">Students</TableHead>
                        <TableHead className="text-gray-300">Routes</TableHead>
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
                                    {bus.driver ? bus.driver.full_name : "no bus driver"}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {
                                        bus.teacher ? bus.teacher?.full_name : "no bus teacher"
                                    }
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.student?.length ? <ViewStudent data={bus.student} /> : "no kids"}
                                </TableCell>
                                <TableCell className="capitalize">
                                    <Link href="#">
                                        {bus.route ? bus.route.route_name : "no route added"}
                                    </Link>
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
