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


type DriversProps = {
    _id: string,
    id: string,
    full_name: string,
    email: string,
    phoneNumber: string,
    address: string,
    image: string,
    bus: string
}

export const CommuteTable = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const router = useRouter()
    const { data: driversData, isPending: driversPending, errorMessage: driversError } = useFetch(`/api/addriver/${userId}`, userId);


    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">


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
                    <TableRow>
                        <TableCell className="w-[250px] text-gray-300">Red bus</TableCell>
                    </TableRow>
                </TableBody>


            </Table>

            <Pagination />
        </div >

    )
}
