"use client"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useEffect, useState, useTransition } from "react"
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

import { SelectProperty } from "@/components/ui/select-wrapper"
import { BusesProps, grades } from "@/data/schooldata"
import { SelectPassengerBus } from "@/components/ui/select-bus-wrapper"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AddData } from "@/components/ui/add-data-button"
import { EditData } from "@/components/ui/edit-data-link"
import LottieAnimation from "@/components/dashboard/sidebar/menuLink/lottie-animation"
import { BusProps, StudentProps } from "@/types"
import minus from "@/public/images/minus.json"
import { handleDelete } from "@/actions/delete-student"
import { toast } from "@/components/ui/use-toast"
import deleted from "@/public/images/delete.json"
import { StudentPresence } from "./presence"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { removeStudentFromBus } from "@/actions/remove-student-bus"
import { ImportStudentsForm } from "../batch-student/import-student"
import { CopyableText } from "@/components/ui/copyable-text"
import { tableStyle } from "@/components/ui/table-style"

type IdProps = {
    studentsData: StudentProps[]
    totalCount: number
    busData: BusesProps[]
    schoolId: string
}

const mockStudentsData: StudentProps[] = [
    {
        id: "mock-student-1",
        full_name: "Noah Carter",
        gender: "male",
        age: 8,
        grade: "Grade 3",
        address: "18 Maple Close, Victoria Island, Lagos",
        image: "",
        presence: "IN_SCHOOL",
        bus: {
            id: "mock-bus-1",
            bus_product_name: "Toyota Coaster",
            bus_number: "PS-102",
        },
    } as StudentProps,
    {
        id: "mock-student-2",
        full_name: "Maya Evans",
        gender: "female",
        age: 7,
        grade: "Grade 2",
        address: "42 Orchid Road, Lekki Phase 1, Lagos",
        image: "",
        presence: "IN_BUS",
        bus: {
            id: "mock-bus-2",
            bus_product_name: "Mercedes Sprinter",
            bus_number: "PS-218",
        },
    } as StudentProps,
    {
        id: "mock-student-3",
        full_name: "Leo Bennett",
        gender: "male",
        age: 9,
        grade: "Grade 4",
        address: "7 Queens Drive, Ikoyi, Lagos",
        image: "",
        presence: "NONE",
        bus: {
            id: "mock-bus-3",
            bus_product_name: "Hyundai County",
            bus_number: "PS-330",
        },
    } as StudentProps,
];

export const StudentsData = ({ studentsData, busData, totalCount, schoolId }: IdProps) => {
    const [isPending, startTransition] = useTransition()
    const [filterGrade, setFilterGrade] = useState<string>("")
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)

    const handleGradeChange = (value: string) => {
        setFilterGrade(value)
        const updatedGradeQuery = value !== "All" ? `&grade=${value}` : "";
    }

    const [isHovering, setIsHovering] = useState(false);

    const handleRemove = (studentId: string, busId: string | undefined) => {
        startTransition(() => {
            removeStudentFromBus(studentId, busId).then((data) => {
                toast({
                    description: data.message,
                });
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }
    const handleModal = () => {
        setIsOpenModal(true)
    }

    const handleStudentDelete = (id: string, mode: string) => {
        startTransition(() => {
            handleDelete(id, mode).then((data) => {
                toast({
                    description: data.message,
                });
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }

    const displayStudentsData = Array.isArray(studentsData) && studentsData.length ? studentsData : mockStudentsData

    return (
        <div className={tableStyle.wrapper}>
            <div className="p-4 flex justify-between gap-3 items-center">
                < AddData label="Student" action={handleModal} />
                <Link href="/dashboard/students/allstudents">
                    <Button variant="link" className="ml-2 text-blue-600">View All Students</Button>
                </Link>
                <ImportStudentsForm schoolId={schoolId} />
            </div>
            {
                isOpenModal && <StudentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }
            <Table className={tableStyle.table}>
                <TableHeader>
                    <TableRow className={tableStyle.headerRow}>
                        <TableHead className={`w-[300px] ${tableStyle.head}`}>Full Name</TableHead>
                        <TableHead className={tableStyle.head}>Gender</TableHead>
                        <TableHead className={tableStyle.head}>Age</TableHead>
                        <TableHead className={`w-[185px] ${tableStyle.head}`}>
                            < SelectProperty placeholder="Grade" label="Filter by Grade" data={grades} handleSelectChange={handleGradeChange} setFilterGrade={setFilterGrade} />
                        </TableHead>
                        <TableHead className={`w-[260px] ${tableStyle.head}`}>Address</TableHead>
                        <TableHead className={`w-[200px] ${tableStyle.head}`}>Bus</TableHead>
                        <TableHead className={tableStyle.head}>Actions</TableHead>

                    </TableRow>

                </TableHeader>
                <TableBody className={tableStyle.body}>
                    {
                        displayStudentsData.map((student: StudentProps) => {
                            return (
                                <TableRow key={student.id} className={tableStyle.row}>
                                    <TableCell className={tableStyle.firstCell}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <div className="flex items-center gap-2">
                                                        <Image src={student.image && student.image || dashboard} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                                        <span className="capitalize">{student.full_name}</span>
                                                        <StudentPresence data={student.presence} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{
                                                        student.presence === "NONE" ? `${student.full_name} is not in school` :
                                                            student.presence === "IN_BUS" ? `${student.full_name} is currently in Bus`
                                                                : `${student.full_name} is currently in School`
                                                    }</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

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
                                    <TableCell className={`${tableStyle.cell} capitalize`}>
                                        {
                                            student?.bus ?
                                                <div className=" space-x-2 flex"> {student?.bus && student?.bus?.bus_product_name}
                                                    <span>
                                                        ({student?.bus && student?.bus?.bus_number})
                                                    </span>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <div
                                                                className='w-[20px] h-[20px] mr-[0.2rem]'
                                                                onMouseEnter={() => setIsHovering(true)}
                                                                onMouseLeave={() => setIsHovering(false)}
                                                            >
                                                                <LottieAnimation isHovering={isHovering} animationData={minus} />
                                                            </div>

                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-gray-900 border-none">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-gray-500 text-md">
                                                                    {` You're about to remove 
                                                                 ${student.full_name} 
                                                                    from ${student.bus.bus_product_name}  with bus Number ${student.bus.bus_number}`}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive"
                                                                    onClick={() => handleRemove(student.id, student?.bus?.id)}
                                                                >
                                                                    Continue
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>

                                                </div> : <div className="w-full">
                                                    {
                                                        busData &&
                                                        < SelectPassengerBus
                                                            placeholder="Select Bus"
                                                            label="Select Bus"
                                                            // @ts-ignore
                                                            data={busData}
                                                            studentId={student.id}
                                                        />
                                                    }
                                                </div>
                                        }
                                    </TableCell>

                                    <TableCell className={tableStyle.actionCell}>
                                        <div className="space-x-2 text-gray-200 flex">
                                            <EditData link={`/dashboard/students/${student.id}`} mode="edit" />

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <div
                                                        className='w-[20px] h-[20px] mr-[0.2rem]'
                                                        onMouseEnter={() => setIsHovering(true)}
                                                        onMouseLeave={() => setIsHovering(false)}
                                                    >
                                                        <LottieAnimation isHovering={isHovering} animationData={deleted} />
                                                    </div>

                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-gray-900 border-none">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-gray-500 text-md">
                                                            {` You're about to delete 
                                                                 ${student.full_name}?
                                                                    `}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive"
                                                            onClick={() => handleStudentDelete(student.id, "student")}
                                                        >
                                                            Continue
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    }
                </TableBody>
            </Table>

            <Pagination count={totalCount} pageCount={2} />
        </div >

    )
}
