"use client"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DriverAndTeacherModal } from "./teachers-modal"
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
import { TeacherProps } from "@/types"
import { Spinner } from "@/components/ui/spinner"


export const TeachersTable = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const [isOpenModal, setIsOpenModal] = useState<boolean>(true);

    const searchParams = useSearchParams()
    const search = searchParams.get("q") || ""

    const { data, isPending, errorMessage } = useFetch(`/api/addteacher/${userId}?q=${search}`, userId);
    const teachersData = data?.teacher
    const totalCount = data?.count
    const handleModal = () => {
        setIsOpenModal(!isOpenModal);
    };
    if (isPending) {
        return <Spinner />

    }

    if (errorMessage) {
        return <p>Error: {errorMessage}</p>;
    }
    return (
        <div>
            {
                isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }
            <div className="p-4 flex justify-end items-center ">
                <Button variant="secondary" onClick={handleModal}>
                    Add new Teacher
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className=" text-[0.7rem]">
                        <TableHead className="w-[250px] text-gray-300">Full Name</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Phone Number</TableHead>
                        <TableHead className="text-gray-300">Address</TableHead>
                        <TableHead className="text-gray-300">Bus No</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody className="text-[0.75rem] text-gray-400 ">
                    {
                        // teachersData && teachersData > 0 ? (
                        teachersData?.map((teacher: TeacherProps) => {
                            console.log(teacher)
                            return (
                                <TableRow key={teacher.id}>
                                    <TableCell className="">
                                        <div className="flex items-center gap-2">
                                            <img src={teacher.image && teacher.image || dashboard} alt={teacher.full_name} className="rounded-md object-cover w-9 h-9" />
                                            <span className="">{teacher.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {teacher.email}
                                    </TableCell>
                                    <TableCell>
                                        {teacher.phoneNumber}
                                    </TableCell>
                                    <TableCell>
                                        {teacher.address}
                                    </TableCell>
                                    <TableCell className="text-[0.7rem] capitalize">
                                        <span>{teacher.busId.color} </span>
                                        {teacher.busId.bus_product_name || "No Bus"}
                                        <span> ({teacher.busId.bus_number})</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-x-2 flex">
                                            <Link href={`/dashboard/teachers/${teacher._id}`}>
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
                        // ) : ""
                    }

                </TableBody>
            </Table>
            <Pagination count={totalCount} />

        </div>

    )
}
