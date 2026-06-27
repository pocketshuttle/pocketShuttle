"use client"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useState, useTransition } from "react"
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell,
} from "@/components/ui/table"

import { ParentModal } from "./parent-modal"
import { ViewStudent } from "@/components/students/ui/view-student-wrapper"
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
import { CopyableText } from "@/components/ui/copyable-text"

type ParentStudent = {
    id: string
    full_name?: string | null
    image?: string | null
    status?: string | null
}

type ParentProps = {
    id: string,
    full_name: string | null,
    phoneNumber: number | string | null,
    email: string | null,
    Student: ParentStudent[],
    address: string | null,
    image: string | null
    student?: string
}

type ParentDataProps = {
    parentData?: ParentProps[]
    totalCount: number
    studentData: ParentStudent[]
}

const mockParentData: ParentProps[] = [
    {
        id: "mock-parent-1",
        full_name: "Edgar Humbert",
        phoneNumber: 8093456701,
        email: "edgar.humbert@pocketshuttle.test",
        Student: [{ id: "mock-student-1", full_name: "Noah Carter", image: "/images/no-avatar.webp", status: "PICKED" }],
        address: "18 Maple Close, Victoria Island, Lagos",
        image: "",
    },
    {
        id: "mock-parent-2",
        full_name: "Craig Howard",
        phoneNumber: 8093456702,
        email: "craig.howard@pocketshuttle.test",
        Student: [{ id: "mock-student-2", full_name: "Maya Evans", image: "/images/no-avatar.webp", status: "PENDING" }],
        address: "42 Orchid Road, Lekki Phase 1, Lagos",
        image: "",
    },
    {
        id: "mock-parent-3",
        full_name: "Timothy Hines",
        phoneNumber: 8093456703,
        email: "timothy.hines@pocketshuttle.test",
        Student: [{ id: "mock-student-3", full_name: "Leo Bennett", image: "/images/no-avatar.webp", status: "PICKED" }],
        address: "7 Queens Drive, Ikoyi, Lagos",
        image: "",
    },
];

export const ParentData = ({ parentData, totalCount, studentData }: ParentDataProps) => {
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)

    const [isHovering, setIsHovering] = useState(false);
    const [, startTransition] = useTransition()

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

    const displayParentData = Array.isArray(parentData) && parentData.length ? parentData : mockParentData


    return (
        <div className="relative overflow-x-auto bg-transparent">
            <div className="flex items-center justify-end px-1 pb-4">

                < AddData label="Parent" action={handleModal} />

            </div>
            {
                isOpenModal && <ParentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }

            <Table className="min-w-[1120px] border-separate border-spacing-y-3 bg-transparent">
                <TableHeader>
                    <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="w-[320px] text-black/60 dark:text-white/55">Full Name</TableHead>
                        <TableHead className="w-[150px] text-black/60 dark:text-white/55">Kids</TableHead>
                        <TableHead className="w-[240px] text-black/60 dark:text-white/55">Address</TableHead>
                        <TableHead className="w-[240px] pl-8 text-black/60 dark:text-white/55">Email</TableHead>
                        <TableHead className="text-black/60 dark:text-white/55">Phone Number</TableHead>
                        <TableHead className="text-black/60 dark:text-white/55">Add Kids</TableHead>
                        <TableHead className="text-black/60 dark:text-white/55">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-sm text-black dark:text-white">
                    {
                        displayParentData.map((parent: ParentProps) => {
                            return (
                                <TableRow key={parent.id} className="border-0 bg-white text-black shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-colors hover:bg-white dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10">
                                    <TableCell className="rounded-l-2xl px-6 py-5 align-middle">
                                        <div className="flex items-center gap-3">
                                            <Image src={parent.image || dashboard} alt={parent.full_name || "Parent"} className="h-10 w-10 rounded-full object-cover" width={100} height={100} />
                                            <span className="font-medium">{parent.full_name || "Unnamed parent"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        {parent.Student.length ? <ViewStudent data={parent.Student} /> : "no kids"}
                                    </TableCell>
                                    <TableCell className="max-w-[240px] px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        <CopyableText label="Address" value={parent.address} fallback="No address" truncateClassName="max-w-[220px]" />
                                    </TableCell>
                                    <TableCell className="px-6 py-5 pl-8 align-middle text-black/75 dark:text-white/70">
                                        <CopyableText label="Email" value={parent.email} fallback="No email" truncateClassName="max-w-[220px]" />
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        <CopyableText label="Phone number" value={parent.phoneNumber} fallback="No phone" truncateClassName="max-w-[140px]" />
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle">
                                        <AddStudents data={studentData} parentId={parent.id} />
                                    </TableCell>

                                    <TableCell className="rounded-r-2xl px-6 py-5 align-middle">
                                        <div className="flex items-center gap-3">
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
                                                <AlertDialogContent className="border-0 bg-white text-black dark:bg-black dark:text-white">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-md capitalize text-black/60 dark:text-white/60">
                                                            {` You're about to delete 
                                                                 ${parent.full_name || "this parent"} ?`}
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
