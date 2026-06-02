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
                <header className="mx-4 mt-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                    {data?.bus === null ? (
                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-700">
                            <span>Teacher hasn’t been assigned a bus. Please contact admin.</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-semibold tracking-tight text-slate-900">Bus Information</h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 capitalize">
                                    {data?.bus?.bus_number || "N/A"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-slate-500">Bus Name:</span>
                                        <span className="min-w-0 truncate text-right font-medium capitalize text-slate-800">
                                            {data?.bus?.bus_product_name || "N/A"}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-slate-500">Driver:</span>
                                        <span className="min-w-0 truncate text-right font-medium capitalize text-slate-800">
                                            {data?.bus?.driver?.full_name || "N/A"}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-slate-500">Driver Contact:</span>
                                        {data?.bus?.driver?.phoneNumber ? (
                                            <a
                                                href={`tel:${data?.bus?.driver?.phoneNumber}`}
                                                className="font-medium text-slate-800 transition hover:text-slate-950"
                                            >
                                                {data?.bus?.driver?.phoneNumber}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">N/A</span>
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-slate-500">Bus Color:</span>
                                        <span className="inline-flex items-center gap-2 text-slate-800">
                                            <span
                                                className="h-3 w-3 rounded-full border border-gray-300"
                                                style={{ backgroundColor: data?.bus?.color || "#ccc" }}
                                            ></span>
                                            <span className="capitalize">{data?.bus?.color || "N/A"}</span>
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </header>


                <main className="w-full space-y-2 px-4 pb-4 pt-3">
                    <h2 className="p-3 text-center">Students</h2>
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

