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
                    <TableRow className="text-gray-300">
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead className="">Address</TableHead>
                        <TableHead className="">Bus</TableHead>
                    </TableRow>

                </TableHeader>

                {/* <TableCaption>Teachers Table</TableCaption> */}
                <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                    {
                        // teachersData && teachersData > 0 ? (
                        teachersData?.map((teacher: TeacherProps) => {
                            console.log(teacher)
                            return (
                                <TableRow key={teacher.id}>
                                    <TableCell className="">
                                        <div className="flex items-center gap-2">
                                            <Image src={teacher.image || dashboard} alt="student name" className="rounded-full object-cover" />
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
