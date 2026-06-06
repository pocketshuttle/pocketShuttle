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
import { Spinner } from "../ui/spinner"
import Navbar from "./navbar"
import { StudentProps } from "@/types"
import { useRecoilValue } from "recoil"
import { BusArrival } from "../parent-view/bus-arrival"
import { Separator } from "../ui/separator"
import { fetchCoordinates, getCurrentLocation, getRoute } from "../maps/lib/utils"
import { EachStudent } from "./ui/student-ui"
import { CopyableText } from "@/components/ui/copyable-text"
import { tableStyle } from "@/components/ui/table-style"
import type { Prisma } from "@/packages/db/client"

export type TeacherViewData = Prisma.TeacherGetPayload<{
    select: {
        Student: {
            include: {
                parent: {
                    select: { address: true }
                }
            }
        }
        bus: {
            include: {
                students: {
                    include: {
                        parent: {
                            select: { address: true }
                        }
                    }
                }
                driver: true
            }
        }
    }
}>
type TeacherStudent =
    | TeacherViewData["Student"][number]
    | NonNullable<TeacherViewData["bus"]>["students"][number]

type SessionProps = {
    userId: string | undefined
    user: any
    data: TeacherViewData
}
interface TeacherLocation {
    latitude: number;
    longitude: number;
};

export const TeachersViewData = ({ userId, user, data }: SessionProps) => {
    const teacherData = data
    const [attendance, SetAttendance] = useState("")
    const students = data?.bus?.students?.length ? data.bus.students : data.Student


    return (
        <div className="relative min-h-[calc(100vh-88px)] overflow-x-auto bg-gray-100 text-black transition-colors dark:bg-black dark:text-white">
            <div className="lg:hidden w-full">
                <header className="mx-4 mt-4 rounded-[26px] border border-black/10 bg-white p-5 text-black shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-colors dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:shadow-none">
                    {data?.bus === null ? (
                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-700 dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-200">
                            <span>Teacher hasn’t been assigned a bus. Please contact admin.</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-semibold tracking-tight text-black dark:text-white">Bus Information</h3>
                                <span className="rounded-full bg-black/5 px-3 py-1 text-sm text-black/60 capitalize dark:bg-white/10 dark:text-white/70">
                                    {data?.bus?.bus_number || "N/A"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-black/55 dark:text-white/55">Bus Name:</span>
                                        <span className="min-w-0 truncate text-right font-medium capitalize text-black/80 dark:text-white/80">
                                            {data?.bus?.bus_product_name || "N/A"}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-black/55 dark:text-white/55">Driver:</span>
                                        <span className="min-w-0 truncate text-right font-medium capitalize text-black/80 dark:text-white/80">
                                            {data?.bus?.driver?.full_name || "N/A"}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-black/55 dark:text-white/55">Driver Contact:</span>
                                        {data?.bus?.driver?.phoneNumber ? (
                                            <a
                                                href={`tel:${data?.bus?.driver?.phoneNumber}`}
                                                className="font-medium text-black/80 transition hover:text-black dark:text-white/80 dark:hover:text-white"
                                            >
                                                {data?.bus?.driver?.phoneNumber}
                                            </a>
                                        ) : (
                                            <span className="text-black/40 dark:text-white/40">N/A</span>
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-black/55 dark:text-white/55">Bus Color:</span>
                                        <span className="inline-flex items-center gap-2 text-black/80 dark:text-white/80">
                                            <span
                                                className="h-3 w-3 rounded-full border border-black/20 dark:border-white/20"
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
                    <h2 className="p-3 text-center text-black dark:text-white">Students</h2>
                    {
                        students?.length ? (
                            students.map((student: TeacherStudent) => {
                            return (
                                <div key={student.id}>
                                    < EachStudent student={student} teacherId={userId || ""} />
                                </div >
                            )
                            })
                        ) : (
                            <p className="rounded-2xl border border-black/10 bg-white p-4 text-center text-sm text-black/55 dark:border-white/10 dark:bg-zinc-950 dark:text-white/55">
                                No students assigned yet.
                            </p>
                        )
                    }
                </main>
            </div >


            <div className="hidden lg:flex lg:flex-col">
                <Table className={tableStyle.compactTable}>
                    <TableHeader>
                        <TableRow className={tableStyle.headerRow}>
                            <TableHead className={`w-[280px] ${tableStyle.head}`}>Full Name</TableHead>
                            <TableHead className={tableStyle.head}>Gender</TableHead>
                            <TableHead className={tableStyle.head}>Grade</TableHead>
                            <TableHead className={`w-[250px] ${tableStyle.head}`}>Address</TableHead>
                            <TableHead className={tableStyle.head}>Attendance</TableHead>
                            <TableHead className={tableStyle.head}>Status</TableHead>
                        </TableRow>

                    </TableHeader>
                    <TableBody className={tableStyle.body}>
                        {
                            students?.length ? (
                                students.map((student: TeacherStudent) => {

                                    return (
                                        <TableRow key={student.id} className={tableStyle.row}>
                                            <TableCell className={tableStyle.firstCell}>
                                                <div className="flex items-center gap-2">
                                                    <Image src={student.image || dashboard} alt={student.full_name || "Student"} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                                    <span className="">{student.full_name || "Unnamed student"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={tableStyle.cell}>
                                                {student.gender || "N/A"}
                                            </TableCell>

                                            <TableCell className={tableStyle.cell}>
                                                {student.grade || "N/A"}
                                            </TableCell>
                                            <TableCell className={`max-w-[260px] ${tableStyle.cell}`}>
                                                <CopyableText label="Address" value={student.address || ""} fallback="No address" truncateClassName="max-w-[240px]" />
                                            </TableCell>
                                            <TableCell className="px-6 py-5 align-middle">
                                                <  AttendanceTab label1="Present" label2="Absent" data={student.attendance ? student.attendance : "No attendance recorded"} value1="PRESENT" value2="ABSENT" SetAttendance={SetAttendance} attendance={attendance} id={student.id} />
                                            </TableCell>
                                            <TableCell className="px-6 py-5 align-middle">
                                                {
                                                    student.attendance === "PRESENT" ?
                                                        <  AttendanceTab label1="Dropped"
                                                            label2="Picked" data={student.status || "No status recorded"} value1="DROPPED" value2="PICKED" SetAttendance={SetAttendance} attendance={attendance} id={student.id} /> : ""
                                                }
                                            </TableCell>

                                            <TableCell className={tableStyle.actionCell}>
                                                <div className="space-x-2">
                                                    <Link href={`/dashboard/students/${student.id}`}>
                                                        <button className="h-9 rounded-lg bg-black px-3 text-xs font-medium text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90">
                                                            view
                                                        </button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow className={tableStyle.row}>
                                    <TableCell colSpan={7} className={tableStyle.emptyCell}>
                                        {teacherData?.bus === null
                                            ? "Teacher hasnt been assigned a bus yet, please contact admin"
                                            : "No students assigned yet."}
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>


                {/* <Pagination count={totalCount} pageCount={4} /> */}
            </div >
        </div >

    )
}
