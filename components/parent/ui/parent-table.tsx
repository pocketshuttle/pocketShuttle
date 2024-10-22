"use client"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useState, useTransition } from "react"
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

import { ParentModal } from "./parent-modal"
import { ViewStudent } from "@/components/students/ui/view-student-wrapper"
import { useSearchParams } from "next/navigation"
import { EditData } from "@/components/ui/edit-data-link"
import { AddData } from "@/components/ui/add-data-button"
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
import deleted from "@/public/images/delete.json"
import LottieAnimation from "@/components/dashboard/sidebar/menuLink/lottie-animation"
import { handleDelete } from "@/actions/delete-student"
import { toast } from "@/components/ui/use-toast"
import { AddStudents } from "./add-to-parent"

type ParentProps = {
    id: string,
    full_name: string,
    phoneNumber: number,
    email: string,
    Student: string,
    address: string,
    image: string
    student?: string
}

type SessionProps = {
    userId: string
}
//@ts-ignore
export const ParentData = ({ parentData, totalCount, studentData }) => {

    const getParams = useSearchParams()
    const page = getParams.get("page") || ""

    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)

    const [isHovering, setIsHovering] = useState(false);
    const [isPending, startTransition] = useTransition()

    const handleModal = () => {
        setIsOpenModal(true)
        // setSelectedParent(parentId);
    }
    const handleParentDelete = (id: string, mode: string) => {
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


    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[var(--bg-root)]">
            <div className="p-4 flex justify-end items-center ">

                < AddData label="Parent" action={handleModal} />

            </div>
            {
                isOpenModal && <ParentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }

            <Table>
                <TableHeader>
                    <TableRow className=" uppercase text-[0.7rem]">
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead className="">
                            kids
                        </TableHead>
                        <TableHead className="w-[250px]">Address</TableHead>
                        <TableHead className="">Email</TableHead>
                        <TableHead className="">Phone Number</TableHead>
                        <TableHead>Add Kids</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                    {
                        parentData && parentData?.map((parent: ParentProps) => {
                            return (
                                <TableRow key={parent.id}>
                                    <TableCell className="">
                                        <div className="flex items-center gap-2">
                                            <Image src={parent.image && parent.image || dashboard} alt={parent.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                            <span className="">{parent.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {parent.Student.length ? <ViewStudent data={parent.Student} /> : "no kids"}
                                    </TableCell>
                                    <TableCell>
                                        {parent.address}
                                    </TableCell>
                                    <TableCell>
                                        {parent.email}
                                    </TableCell>
                                    <TableCell>
                                        {parent.phoneNumber}
                                    </TableCell>
                                    <TableCell>
                                        <AddStudents data={studentData} parentId={parent.id} />
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-x-2 flex">
                                            <EditData link={`/dashboard/parent/${parent.id}`} mode="edit" />
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
                                                                 ${parent.full_name} ?
        `}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive"
                                                            onClick={() => handleParentDelete(parent.id, "parent")}
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


            <Pagination count={totalCount} pageCount={4} />
        </div >

    )
}
