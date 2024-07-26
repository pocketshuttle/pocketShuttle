"use client"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import Link from "next/link"
import { DriverAndTeacherModal } from "@/components/Teachers/ui/teachers-modal"
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
import { DriversProps } from "@/types"
import { Spinner } from "@/components/ui/spinner"




export const DriverTable = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const searchParams = useSearchParams()
    const searchDriver = searchParams.get("q") || " "

    const router = useRouter()
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const { data: driversData, isPending: driversPending, errorMessage: driversError } = useFetch(`/api/addriver/${userId}?q=${searchDriver}`, userId);

    const handleModal = () => {
        setIsOpenModal(!isOpenModal)
    }
    if (driversPending) {
        return <Spinner />
    }

    if (driversError) {
        return <p>Error: {driversError}</p>;
    }
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">
            {
                isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} mode="driver" />
            }

            <div className="p-4 flex justify-between items-center ">
                <Button variant="secondary" onClick={handleModal}>
                    Add new driver
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className=" text-[0.7rem] ">
                        <TableHead className="w-[250px] text-gray-300">Full Name</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Phone Number</TableHead>
                        <TableHead className="text-gray-300">Address</TableHead>
                        <TableHead className="text-gray-300">Bus</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-[0.75rem] text-gray-400 ">
                    {
                        driversData && driversData?.map((driver: DriversProps, index: any) => {
                            console.log(driver)
                            return (
                                <TableRow key={driver._id}>
                                    <TableCell className="">
                                        <div className="flex items-center gap-2">
                                            <img src={driver.image && driver.image || dashboard} alt={driver.full_name} className="rounded-md object-cover w-9 h-9" />
                                            <span className="">{driver.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {driver.email}
                                    </TableCell>
                                    <TableCell>
                                        {driver.phoneNumber}
                                    </TableCell>
                                    <TableCell>
                                        {driver.address}
                                    </TableCell>
                                    <TableCell className="text-[0.7rem] capitalize">
                                        <span>{driver.bus.color} </span>
                                        {driver.bus.bus_product_name || "No Bus"}
                                        <span> ({driver.bus.bus_number})</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-x-2 flex">
                                            <Link href={`/dashboard/driver/${driver._id}`}>
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
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    }
                </TableBody>


            </Table>

            <Pagination />
        </div >

    )
}
