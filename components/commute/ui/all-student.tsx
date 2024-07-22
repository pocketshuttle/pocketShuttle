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
import { useFetch } from "@/hooks/useFetch"
import { useSession } from "next-auth/react"

type StudentProps = {
    _id: string,
    full_name: string,
    age: number,
    gender: string,
    grade: string,
    address: string,
    bus: string
    , image: string
}
export const StudentsData = ({ data }) => {
    // const { data: session } = useSession()
    // const userId = session?.user?.id

    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    // const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${userId}`, userId);

    // console.log(studentsData);

    return (
        <div className=" w-full shadow-md sm:rounded-lg bg-[#182237]">
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for students..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
            </div>

            <Table>
                <TableHeader>
                    <TableRow className=" uppercase text-[0.7rem]">
                        <TableHead className="">Bus</TableHead>
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="">Age</TableHead>
                        <TableHead className="">Grade</TableHead>
                        <TableHead className="w-[250px]">Address</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                    {
                        data && data?.map((student: StudentProps) => {
                            return (
                                <TableRow key={student._id}>
                                    <TableCell className="">
                                        <div className="flex items-center gap-2">
                                            <Image src={student.image && student.image || dashboard} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                            <span className="">{student.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {student.gender}
                                    </TableCell>
                                    <TableCell>
                                        {student.age}
                                    </TableCell>
                                    <TableCell>
                                        {student.grade}
                                    </TableCell>
                                    <TableCell>
                                        {student.address}
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
