"use client"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import avatar from "@/public/images/avatar.jpg"
import Image from "next/image"
import { useEffect, useState } from "react"
import { StudentModal } from "@/components/students/ui/Student-modal"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
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
import { useRecoilValue } from "recoil"
import { studentETA } from "@/atoms/eta"
import { BusArrival } from "../parent-view/bus-arrival"
import { Separator } from "../ui/separator"
import { fetchCoordinates, getCurrentLocation, getRoute } from "../maps/lib/utils"
import { EachStudent } from "./ui/student-ui"

type SessionProps = {
    userId: string | undefined
    user: any
    data: TeacherProps
}
interface TeacherLocation {
    latitude: number;
    longitude: number;
};
export const TeachersViewData = ({ userId, user, data }: SessionProps) => {
    const searchParams = useSearchParams()
    const page = searchParams.get("page")
    const eta = useRecoilValue(studentETA)
    const teacherData = data
    const [attendance, SetAttendance] = useState("")


    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[var(--bg-root)]">
            <div className=" lg:hidden w-full">
                <header className=" px-4  space-y-4 text-lg text-gray-400">
                    {
                        data?.bus === null ? <span>Teacher hasnt been assigned a bus, please contact admin</span> :
                            <div className="flex flex-col">
                                <p className="space-x-4">
                                    <small>
                                        Bus Name :
                                    </small>
                                    <span className="capitalize">{
                                        data?.bus &&
                                        data?.bus.bus_product_name
                                    }
                                    </span>
                                </p>
                                <p className="space-x-4">
                                    <small>
                                        Driver :
                                    </small>
                                    <span className="capitalize">
                                        {
                                            data?.bus?.driver &&
                                            data?.bus?.driver?.full_name}
                                    </span>
                                </p>
                                <p className="space-x-4">
                                    <small>
                                        Driver Contact:
                                    </small>
                                    <span className="capitalize">
                                        {
                                            data?.bus?.driver &&
                                            data?.bus?.driver?.phoneNumber}
                                    </span>
                                </p>
                            </div>
                    }
                </header>

                <main className="px-4 space-y-2 w-full">
                    <h2 className="text-center p-4">Students</h2>
                    {
                        data?.bus &&
                        data?.bus.students &&
                        data?.bus.students?.map((student: StudentProps) => (
                            <div key={student.id}>
                                < EachStudent student={student} />
                            </div >
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


