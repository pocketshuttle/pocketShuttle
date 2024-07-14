"use client"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useRouter } from "next/navigation"
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

type TeacherProps = {
    _id: string,
    id: string,
    full_name: string,
    email: string,
    phoneNumber: string,
    address: string,
    image: string,
    busId: string
}
export const TeachersTable = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id
    const { data: teachersData, isPending, errorMessage } = useFetch(`/api/addteacher/${userId}`, userId);
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

    console.log(session)
    const handleModal = () => {
        setIsOpenModal(!isOpenModal);
    };
    if (isPending) {
        return <p>Loading...</p>;
    }

    if (errorMessage) {
        return <p>Error: {errorMessage}</p>;
    }
    return (
        <div>
            {
                isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for teachers..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <Button variant="secondary" onClick={handleModal}>
                    add new
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className=" text-[0.7rem]">
                        <TableHead className="w-[250px] text-gray-300">Full Name</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Phone Number</TableHead>
                        <TableHead className="text-gray-300">Address</TableHead>
                        <TableHead className="text-gray-300">Bus</TableHead>
                    </TableRow>
                </TableHeader>

                {/* <TableCaption>Teachers Table</TableCaption> */}
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
                                    <TableCell className="text-[0.7rem]">
                                        {teacher.busId || "No Bus"}
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
        </div>

    )
}
