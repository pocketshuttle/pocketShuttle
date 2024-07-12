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

type TeachersDriversProps = {
    full_name?: string
    email?: string
    phone?: string
    address?: string

    busId: string

}


export const TeachersAndDriverTable = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const router = useRouter();
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

    const { data: teachersData, isPending, errorMessage } = useFetch(`/api/addteacher/${userId}`, userId);

    const handleModal = () => {
        setIsOpenModal(!isOpenModal);
    };

    if (isPending) {
        return <p>Loading...</p>;
    }

    console.log(teachersData)

    if (errorMessage) {
        return <p>Error: {errorMessage}</p>;
    }

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">
            {
                isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }


            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for teachers..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <Button variant="secondary" onClick={handleModal}>
                    add new
                </Button>
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-300 capitalize  ">
                    <tr >
                        <th scope="col" className="px-6 py-3" rowSpan={6}>
                            Full Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Email
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Phone Number
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Address
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Bus No
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        teachersData && teachersData.length > 0 ? (
                            teachersData.map((teacher, index) => {
                                return (
                                    <tr className="dark:bg-gray-800  hover:bg-gray-900 cursor-pointer text-[var(--textSoft)] text-[0.7rem]">

                                        <td className="px-6 py-4" rowSpan={5}>
                                            <div className="flex items-center gap-2">
                                                <Image src={dashboard} alt="student name" className="rounded-full object-cover" />
                                                <span className="">{teacher.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 ">
                                            {teacher.email}
                                        </td>
                                        <td className="px-6 py-4  ">
                                            {teacher.phoneNumber}
                                        </td>
                                        <td className="px-6 py-4 ">
                                            {teacher.address}
                                        </td>
                                        <td className="px-6 py-4 ">
                                            {teacher.busId}
                                            {/* TODO
                                            Add the bus */}
                                            kskek
                                            {/* {teacher.password} */}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-x-2">
                                                <Link href={`/dashboard/teachers/jjkknlk`}>
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

                                )
                                console.log(teacher)
                            })
                        ) :
                            ""
                    }

                    {/* <td className="px-6 py-4" rowSpan={8}>
                            <div className="flex items-center gap-2">
                                <Image src={dashboard} alt="student name" className="rounded-full object-cover" />
                                <span className="">John Doe</span>
                            </div>
                        </td> */}
                    {/* <td className="px-6 py-4 ">
                        7
                    </td>
                    <td className="px-6 py-4  ">
                        ongoing
                    </td>
                    <td className="px-6 py-4 ">
                        12/20/2024
                    </td>
                    <td className="px-6 py-4 ">
                        000/20/2024
                    </td>
                    <td className="px-6 py-4">
                        <div className="space-x-2">
                            <Link href={`/dashboard/teachers/jjkknlk`}>
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
                    </td> */}

                </tbody>
            </table>


            
            <Pagination />
        </div >

    )
}
