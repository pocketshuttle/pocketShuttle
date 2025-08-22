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
    const teacherData = data
    const [attendance, SetAttendance] = useState("")

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[var(--bg-root)]">
            <div className="lg:hidden w-full">
                <header className="px-4 py-6 rounded-lg shadow-sm">
                    {data?.bus === null ? (
                        <div className="text-center p-4 bg-yellow-50 rounded border border-yellow-200 text-yellow-700">
                            <span>Teacher hasn't been assigned a bus. Please contact admin.</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-xl font-medium text-gray-400 mb-2">Bus Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-300">Bus Name:</span>
                                        <span className="text-gray-200 font-medium capitalize">
                                            {data?.bus?.bus_product_name || 'N/A'}
                                        </span>
                                    </p>
                                    <p className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-300">Driver:</span>
                                        <span className="text-gray-200 font-medium capitalize">
                                            {data?.bus?.driver?.full_name || 'N/A'}
                                        </span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-300">Driver Contact:</span>
                                        <a
                                            href={`tel:${data?.bus?.driver?.phoneNumber}`}
                                            className="text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            {data?.bus?.driver?.phoneNumber || 'N/A'}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                <main className="px-4 space-y-2 w-full">
                    <h2 className="text-center p-4">Students</h2>
                    {
                        data?.bus &&
                        data?.bus.students &&
                        data?.bus.students?.map((student: StudentProps) => {
                            return (
                                <div key={student.id}>
                                    < EachStudent student={student} teacherId={userId || ""} />
                                </div >
                            )
                        })
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


