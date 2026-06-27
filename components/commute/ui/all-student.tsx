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
import { tableStyle } from "@/components/ui/table-style"


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

            <Table className={tableStyle.compactTable}>
                <TableHeader>
                    <TableRow className={tableStyle.headerRow}>
                        <TableHead className={tableStyle.head}>Bus</TableHead>
                        <TableHead className={`w-[260px] ${tableStyle.head}`}>Full Name</TableHead>
                        <TableHead className={tableStyle.head}>Gender</TableHead>
                        <TableHead className={tableStyle.head}>Age</TableHead>
                        <TableHead className={tableStyle.head}>Grade</TableHead>
                        <TableHead className={`w-[250px] ${tableStyle.head}`}>Address</TableHead>
                        <TableHead className={tableStyle.head}>Status</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className={tableStyle.body}>
                    {
                        data && data?.map((student: StudentProps) => {
                            return (
                                <TableRow key={student._id} className={tableStyle.row}>
                                    <TableCell className={tableStyle.firstCell}>
                                        {student.bus || "No bus"}
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle">
                                        <div className="flex items-center gap-2">
                                            <Image src={student.image && student.image || dashboard} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                            <span className="">{student.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className={tableStyle.cell}>
                                        {student.gender}
                                    </TableCell>
                                    <TableCell className={tableStyle.cell}>
                                        {student.age}
                                    </TableCell>
                                    <TableCell className={tableStyle.cell}>
                                        {student.grade}
                                    </TableCell>
                                    <TableCell className={`max-w-[260px] ${tableStyle.cell}`}>
                                        <CopyableText label="Address" value={student.address} fallback="No address" truncateClassName="max-w-[240px]" />
                                    </TableCell>
                                    <TableCell className={`${tableStyle.actionCell} text-black/75 dark:text-white/70`}>
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
