"use client"

import dashboard from "@/public/images/dashboard.svg"
import { DriverAndTeacherModal } from "./teachers-modal"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import { useFetch } from "@/hooks/useFetch"
import { useSession } from "next-auth/react"
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
import { TeacherProps } from "@/types"
import { Spinner } from "@/components/ui/spinner"
import { AddToBus } from "@/components/buses/add-to-bus"
import { AddData } from "@/components/ui/add-data-button"
import { EditData } from "@/components/ui/edit-data-link"
import minus from "@/public/images/minus.json"
import deleted from "@/public/images/delete.json"
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
import LottieAnimation from "@/components/dashboard/sidebar/menuLink/lottie-animation"
import { useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { removeTeacherFromBus } from "@/actions/remove-teacher-bus"
import { toast } from "@/components/ui/use-toast"
import { handleDelete } from "@/actions/delete-student"

export const TeachersTable = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const [isPending, startTransition] = useTransition()


    const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

    const searchParams = useSearchParams()
    const search = searchParams.get("q") || ""
    const page = searchParams.get("page") || 1
    const [isHovering, setIsHovering] = useState(false);

    const { data, isPending: loading, errorMessage } = useFetch(`/api/addteacher/${userId}?q=${search}&page=${page}`, userId);
    const { data: studentData, } = useFetch(`/api/addstudent/${userId}?q=${search}&page=${page}`, userId);
    const { data: busData, } = useFetch(`/api/addbus/${userId}`, userId);
    const teachersData = data?.teacher
    const totalCount = data?.count

    const handleModal = () => {
        setIsOpenModal(!isOpenModal);
    };

    const handleRemove = (teacherId: string, busId: string) => {
        startTransition(() => {
            removeTeacherFromBus(teacherId, busId).then((data) => {
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
    const handleTeacherDelete = (id: string, mode: string) => {
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

    // if (errorMessage) {
    //     return <p>Error: {errorMessage}</p>;
    // }
    return (
        <div>
            {
                isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} mode="teacher" />
            }
            <div className="p-4 flex justify-end items-center ">
                < AddData label="Teacher" action={handleModal} />
            </div>
            {
                loading ? <Spinner /> :
                    <Table>
                        <TableHeader>
                            <TableRow className=" text-[0.7rem] bg-[var(--hoverBg)]">
                                <TableHead className="w-[250px] text-gray-300">Full Name</TableHead>
                                <TableHead className="text-gray-300">Email</TableHead>
                                <TableHead className="text-gray-300">Phone Number</TableHead>
                                <TableHead className="text-gray-300">Address</TableHead>
                                <TableHead className="text-gray-300">Bus No</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="text-[0.75rem] text-gray-400 ">
                            {
                                // teachersData && teachersData > 0 ? (
                                teachersData?.map((teacher: TeacherProps) => {
                                    return (
                                        <TableRow key={teacher.id}>
                                            <TableCell className="">
                                                <div className="flex items-center gap-2">
                                                    <img src={teacher.image && teacher.image || dashboard} alt={teacher.full_name} className="rounded-md object-cover w-9 h-9" />
                                                    <span className="capitalize">{teacher.full_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {teacher.email}
                                            </TableCell>
                                            <TableCell>
                                                {teacher.phoneNumber}
                                            </TableCell>
                                            <TableCell>
                                                {teacher.address}
                                            </TableCell>
                                            <TableCell className="text-[0.7rem] capitalize ">
                                                {
                                                    teacher.bus ? <div className="flex space-x-1">
                                                        <div>
                                                            <span>{teacher.bus.color} </span>
                                                            <span>{teacher.bus.bus_product_name}</span>(
                                                            <span>{teacher.bus.bus_number}</span>)
                                                        </div>

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
                                                                 ${teacher.full_name} 
                                                                    from ${teacher.bus.bus_product_name}  with bus Number ${teacher.bus.bus_number}`}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-destructive"
                                                                        onClick={() => handleRemove(teacher.id, teacher.bus.id)}
                                                                    >
                                                                        Continue
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>

                                                    </div> :
                                                        <div className="w-full">
                                                            {
                                                                busData &&
                                                                < AddToBus
                                                                    placeholder="Select Bus"
                                                                    label="Select Bus"
                                                                    data={busData}
                                                                    id={teacher.id}
                                                                    mode="teacher"
                                                                />
                                                            }
                                                        </div>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-x-2 flex">
                                                    <EditData link={`/dashboard/teachers/${teacher.id}`} mode="edit" />
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
                                                                <AlertDialogDescription className="text-gray-500 text-md capitalize">
                                                                    {` You're about to delete 
                                                                 ${teacher.full_name}?
                                                                    `}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive"
                                                                    onClick={() => handleTeacherDelete(teacher.id, "teacher")}
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
                    </Table>}
            <Pagination count={totalCount} pageCount={2} />

        </div>

    )
}
