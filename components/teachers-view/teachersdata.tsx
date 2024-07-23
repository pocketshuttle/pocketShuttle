"use client"
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
import { AttendaceTab } from "./ui/register-tab"

type StudentProps = {
    _id: string,
    full_name: string,
    age: number,
    gender: string,
    grade: string,
    address: string,
    bus: string
    , image: string
    attendance: string
    status: string

}



export const TeachersViewData = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${userId}`, userId);

    const [attendance, SetAttendance] = useState("")

    console.log(studentsData)
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">

            {/* {
                isOpenModal && <StudentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            } */}

            <Table>
                <TableHeader>
                    <TableRow className=" uppercase text-[0.7rem]">
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="">Grade</TableHead>
                        <TableHead className="w-[250px]">Address</TableHead>
                        <TableHead className="">Attendance</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                    {
                        studentsData && studentsData?.map((student: StudentProps) => {
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
                                        {student.grade}
                                    </TableCell>
                                    <TableCell>
                                        {student.address}
                                    </TableCell>
                                    <TableCell>
                                        <  AttendaceTab label1="Present" label2="Absent" data={student.attendance} value1="present" value2="absent" SetAttendance={SetAttendance} attendance={attendance} id={student._id} />
                                    </TableCell>
                                    <TableCell>
                                        {
                                            student.attendance === "present" ?
                                                <  AttendaceTab label1="Dropped" label2="Picked" data={student.status} value1="dropped" value2="picked" SetAttendance={SetAttendance} attendance={attendance} id={student._id} /> : ""
                                        }
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-x-2">
                                            <Link href={`/dashboard/students/${student._id}`}>
                                                <button className="bg-[teal] px-2 text-[0.5rem] rounded-sm">
                                                    view
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
