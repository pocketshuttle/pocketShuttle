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
import { AttendanceTab } from "./ui/register-tab"
import { useSearchParams } from "next/navigation"
import { Spinner } from "../ui/spinner"
import Navbar from "./navbar"
import { StudentProps, TeacherProps } from "@/types"

type SessionProps = {
    userId: string | undefined
    user: any
    data: TeacherProps
}

export const TeachersViewData = ({ userId, user, data }: SessionProps) => {
    const searchParams = useSearchParams()
    const page = searchParams.get("page")

    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const teacherData = data

    const [attendance, SetAttendance] = useState("")


    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[var(--bg-root)]">

            <div className=" lg:hidden w-full">
                <header className=" px-4  space-y-4 text-lg text-gray-400">
                    {
                        data?.bus === null ? <span>Teacher hasnt been assigned a bus, please contact admin</span> :
                            <div className="flex flex-col">
                                <p>
                                    Bus Name :
                                    <span className="capitalize">{
                                        data?.bus &&
                                        data?.bus.bus_product_name
                                    }
                                    </span>
                                </p>
                                <p>
                                    Driver : <span className="capitalize">
                                        {
                                            data?.bus?.driver &&
                                            data?.bus?.driver?.full_name}
                                    </span>
                                </p>
                                <p>
                                    Driver Contact : <span className="capitalize">
                                        {
                                            data?.bus?.driver &&
                                            data?.bus?.driver?.phoneNumber}
                                    </span>
                                </p>
                            </div>
                    }
                </header>



                <main className="px-4 space-y-2 w-full">
                    <h2>Students</h2>
                    {
                        data?.bus &&
                        data?.bus.students &&
                        data?.bus.students?.map((student: StudentProps) => (
                            <div className="flex items-center  bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md" key={student.id}>
                                <Link href={`teacher/${student.id}`}>
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
                                                <  AttendanceTab label1="Present" label2="Absent" data={student.attendance ? student.attendance : "No attendance recorded"}
                                                    value1="PRESENT" value2="ABSENT" SetAttendance={SetAttendance} attendance={attendance} id={student.id} />
                                            }
                                        </div>
                                        <div>
                                            {
                                                student.attendance === "PRESENT" ?
                                                    <  AttendanceTab label1="Dropped" label2="Picked" data={student.status} value1="DROPPED" value2="PICKED"
                                                        SetAttendance={SetAttendance} attendance={attendance} id={student.id} /> : ""
                                            }
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))
                    }
                </main>
            </div >


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
                            teacherData?.bus === null ? <p>Teacher hasnt been assigned a bus yet, please contact admin</p> :
                                data?.bus?.students?.map((student: StudentProps) => {
                                    return (
                                        <TableRow key={student.id}>
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
                                                <  AttendanceTab label1="Present" label2="Absent" data={student.attendance ? student.attendance : "No attendance recorded"} value1="PRESENT" value2="ABSENT" SetAttendance={SetAttendance} attendance={attendance} id={student.id} />
                                            </TableCell>
                                            <TableCell>
                                                {
                                                    student.attendance === "PRESENT" ?
                                                        <  AttendanceTab label1="Dropped"
                                                            label2="Picked" data={student.status} value1="DROPPED" value2="PICKED" SetAttendance={SetAttendance} attendance={attendance} id={student.id} /> : ""
                                                }
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-x-2">
                                                    <Link href={`/dashboard/students/${student.id}`}>
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


                {/* <Pagination count={totalCount} pageCount={4} /> */}
            </div >
        </div >

    )
}


