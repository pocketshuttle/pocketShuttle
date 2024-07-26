"use client"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import avatar from "@/public/images/avatar.jpg"
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
    const { data: teacherData, isPending: busLoading, } = useFetch(`/api/addteacher/${userId}`, userId);

    const [attendance, SetAttendance] = useState("")

    console.log(teacherData)
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[var(--bgSoft)]">

            {/* {
                isOpenModal && <StudentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            } */}
            {

            }

            <div className="mt-4 bg-[var(--bg)] lg:hidden w-full">
                <header className=" px-4 py-1 space-y-2 text-lg">
                    <p>
                        BusName : <span className="capitalize">{teacherData?.[0]?.busId.bus_product_name}</span>
                    </p>
                    <p>
                        Driver : <span></span>
                    </p>
                </header>




                <main className="px-4 space-y-2 w-full">
                    <h2>Students</h2>
                    {
                        teacherData?.[0]?.busId.student.map((student: StudentProps) => (
                            <div className="flex items-center  bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md">
                                <Link href={`teacher/${student._id}`}>
                                    <Image src={student.image || avatar} alt={student.full_name} className="rounded-md object-cover w-24 h-24" width={100} height={100} />
                                </Link>

                                <div className="py-4 space-y-2">
                                    <h2 className="space-x-2">{student.full_name}
                                        <small className="ml-2 text-[var(--textSoft)]">{student.age}</small>
                                        <small className=" text-[var(--textSoft)]">{student.grade}</small>
                                    </h2>
                                    <p className="text-sm text-[var(--textSoft)]">{student.address}</p>
                                    <div className="flex space-x-3 ">
                                        <div>
                                            {
                                                <  AttendaceTab label1="Present" label2="Absent" data={student.attendance} value1="present" value2="absent" SetAttendance={SetAttendance} attendance={attendance} id={student._id} />
                                            }
                                        </div>
                                        <div>
                                            {
                                                student.attendance === "present" ?
                                                    <  AttendaceTab label1="Dropped" label2="Picked" data={student.status} value1="dropped" value2="picked" SetAttendance={SetAttendance} attendance={attendance} id={student._id} /> : ""
                                            }
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))
                    }
                </main>
            </div>


            <div className="hidden lg:flex lg:flex-col">
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
        </div>

    )
}
