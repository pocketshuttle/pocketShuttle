import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useState } from "react"
import { StudentModal } from "@/components/students/ui/Student-modal"
import Link from "next/link"
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

export const StudentsData = () => {
    const [isOpenModal, setIsOpenModal] = useState<boolean>(true)



    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for students..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <Button variant="secondary" onClick={() => setIsOpenModal(true)}>
                    add new
                </Button>
            </div>
            {
                isOpenModal && <StudentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }

            <Table>
                <TableHeader>
                    <TableRow className=" uppercase text-[0.7rem]">
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="">Age</TableHead>
                        <TableHead className="">Gender</TableHead>
                        <TableHead className="w-[150px]">Teacher</TableHead>
                        <TableHead className="w-[250px]">Address</TableHead>
                        <TableHead className="">Bus</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                    <TableCell className="">
                        {/* <div className="flex items-center gap-2">
                            <img src={teacher.image && teacher.image || dashboard} alt={teacher.full_name} className="rounded-md object-cover w-9 h-9" />
                            <span className="">{teacher.full_name}</span>
                        </div> */}
                    </TableCell>
                    <TableCell>
                        {/* {teacher.email} */}
                    </TableCell>
                    <TableCell>
                        <div className="space-x-2">
                            <Link href="/dashboard/students/idie">
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
                </TableBody>
            </Table>


            <Pagination />
        </div >

    )
}
