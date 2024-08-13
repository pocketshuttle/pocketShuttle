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
import { useFetch } from "@/hooks/useFetch"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { SelectProperty } from "@/components/ui/select-wrapper"
import { grades } from "@/data/schooldata"
import { Spinner } from "@/components/ui/spinner"
import { SelectBusWrapper } from "@/components/Teachers/ui/select-bus-wrapper"
import { SelectPassengerBus } from "@/components/ui/select-bus-wrapper"
import useUpdateAttendance from "@/hooks/usePatch"
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
import { StudentProps } from "@/types"
import minus from "@/public/images/minus.json"
import { handleDelete } from "@/actions/delete-student"
import { toast } from "@/components/ui/use-toast"
import deleted from "@/public/images/delete.json"

type IdProps = {
    userId: string
}

export const StudentsData = ({ userId }: IdProps) => {

    const [isPending, startTransition] = useTransition()
    const [filterGrade, setFilterGrade] = useState<string>("")
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)

    const searchParams = useSearchParams()
    const search = searchParams.get("q") || ""

    const page = searchParams.get("page") || 1

    const handleGradeChange = (value: string) => {
        setFilterGrade(value)
    }

    const gradeQuery = filterGrade !== "All" ? `&grade=${filterGrade}` : "";

    const { data, isPending: studentLoading, errorMessage } = useFetch(`/api/addstudent/${userId}?q=${search}${gradeQuery}&page=${page}`, userId);
    const { data: busData, isPending: busLoading, errorMessage: busError } = useFetch(`/api/addbus/${userId}?q=${search}&grade=${filterGrade}&page=${page}`, userId);
    //@ts-ignore
    const { updateAtendance, loading, error } = useUpdateAttendance(userId, "DELETE");

    const studentsData = data?.students || [];
    const totalCount = data?.count || 0;

    const [isHovering, setIsHovering] = useState(false);

    const handleRemove = (value: string) => {
        console.log(value)
        updateAtendance(JSON.parse(value), `/api/addbus/addstudent/${userId}`)
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
                // window.location.reload();
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }


    // if (studentLoading) {
    //     return <Spinner />
    // }

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[var(--bg-root))]">
            <div className="p-4 flex justify-end items-center ">
                <div className="gap-3 flex">
                    <Link href="/dashboard/students/allstudents">
                        <Button variant="link" className="ml-2 text-blue-600">View All Students</Button>
                    </Link>
                    < AddData label="Student" action={handleModal} />
                </div>
            </div>
            {
                isOpenModal && <StudentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }

            <Table>
                <TableHeader className="bg-[var(--hoverBg)] ">
                    <TableRow className="capitalize text-[0.7rem] border-[1px] border-gray-500 rounded-md ">
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="">Age</TableHead>
                        <TableHead className="w-[185px]">
                            < SelectProperty placeholder="Grade" label="Filter by Grade" data={grades} handleSelectChange={handleGradeChange} setFilterGrade={setFilterGrade} />
                        </TableHead>
                        <TableHead className="w-[300px]">Address</TableHead>
                        <TableHead className="w-[200px]">Bus</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>

                </TableHeader>
                {studentLoading ?

                    <div className="flex items-center justify-center">
                        <Spinner />
                    </div>

                    : <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                        {
                            studentsData && studentsData?.map((student: StudentProps) => {
                                return (
                                    <TableRow key={student.id}>
                                        <TableCell className="">
                                            <div className="flex items-center gap-2">
                                                <Image src={student.image && student.image || dashboard} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                                <span className="capitalize">{student.full_name}</span>
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
                                        <TableCell className="capitalize">
                                            {
                                                student.bus ?
                                                    <div className=" space-x-2 flex"> {student.bus && student.bus.bus_product_name}
                                                        <span>
                                                            ({student.bus && student.bus.bus_number})
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
                                                                        onClick={() => handleRemove(JSON.stringify({ studentId: student.id, busId: student.bus.id }))}
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
                                                                data={busData}
                                                                studentId={student.id}
                                                            />
                                                        }
                                                    </div>
                                            }
                                        </TableCell>
                                        <TableCell>
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
                    </TableBody>}
            </Table>

            <Pagination count={totalCount} pageCount={2} />
        </div >

    )
}
