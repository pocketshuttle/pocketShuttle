import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CopyableText } from "@/components/ui/copyable-text"


type StudentProps = {
    _id: string,
    full_name: string,
    age: number,
    gender: string,
    grade: string,
    address: string,
    bus: string,
    image: string
}

export const StudentsData = ({ data }: { data?: StudentProps[] }) => {

    return (
        <div className="w-full bg-transparent">
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for students..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
            </div>

            <Table className="min-w-[980px] border-separate border-spacing-y-3 bg-transparent">
                <TableHeader>
                    <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="text-black/60 dark:text-white/55">Bus</TableHead>
                        <TableHead className="w-[260px] text-black/60 dark:text-white/55">Full Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="">Age</TableHead>
                        <TableHead className="">Grade</TableHead>
                        <TableHead className="w-[250px]">Address</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className="text-sm text-black dark:text-white">
                    {
                        data && data?.map((student: StudentProps) => {
                            return (
                                <TableRow key={student._id} className="border-0 bg-white text-black shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-colors hover:bg-white dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10">
                                    <TableCell className="rounded-l-2xl px-6 py-5 align-middle">
                                        {student.bus || "No bus"}
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle">
                                        <div className="flex items-center gap-2">
                                            <Image src={student.image && student.image || dashboard} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                            <span className="">{student.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        {student.gender}
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        {student.age}
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        {student.grade}
                                    </TableCell>
                                    <TableCell className="max-w-[260px] px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        <CopyableText label="Address" value={student.address} fallback="No address" truncateClassName="max-w-[240px]" />
                                    </TableCell>
                                    <TableCell className="rounded-r-2xl px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        -
                                    </TableCell>

                                </TableRow>
                            )
                        })
                    }
                </TableBody>
            </Table>

            <Pagination count={10} pageCount={10} />
        </div >

    )
}
