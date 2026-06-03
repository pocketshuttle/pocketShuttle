"use client"
import dashboard from "@/public/images/dashboard.svg"
import { DriverAndTeacherModal } from "./teachers-modal"
import { Pagination } from "@/components/dashboard/pagination/pagination"
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
import { useState, useTransition } from "react"
import { removeTeacherFromBus } from "@/actions/remove-teacher-bus"
import { toast } from "@/components/ui/use-toast"
import { handleDelete } from "@/actions/delete-student"
import { CopyableText } from "@/components/ui/copyable-text"


type userProps = {
    teacherCount?: number | undefined,
    teachersData?: any[],
    busData?: any[]
}

const mockTeachersData: TeacherProps[] = [
    {
        id: "mock-teacher-1",
        full_name: "Amelia Hart",
        email: "amelia.hart@pocketshuttle.test",
        phoneNumber: "08012341001",
        address: "12 Cedar Avenue, Ikoyi, Lagos",
        image: "/images/no-avatar.webp",
        bus: {
            id: "mock-bus-1",
            color: "yellow",
            bus_product_name: "Toyota Coaster",
            bus_number: "PS-102",
        },
    } as TeacherProps,
    {
        id: "mock-teacher-2",
        full_name: "Grace Wilson",
        email: "grace.wilson@pocketshuttle.test",
        phoneNumber: "08012341002",
        address: "8 Admiralty Way, Lekki, Lagos",
        image: "/images/no-avatar.webp",
        bus: {
            id: "mock-bus-2",
            color: "white",
            bus_product_name: "Mercedes Sprinter",
            bus_number: "PS-218",
        },
    } as TeacherProps,
    {
        id: "mock-teacher-3",
        full_name: "Helen Moore",
        email: "helen.moore@pocketshuttle.test",
        phoneNumber: "08012341003",
        address: "23 Bourdillon Road, Ikoyi, Lagos",
        image: "/images/no-avatar.webp",
        bus: {
            id: "mock-bus-3",
            color: "blue",
            bus_product_name: "Hyundai County",
            bus_number: "PS-330",
        },
    } as TeacherProps,
];

export const TeachersTable = ({ teacherCount, teachersData, busData }: userProps) => {
    const [isPending, startTransition] = useTransition()
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
    const [isHovering, setIsHovering] = useState(false);

    const handleModal = () => {
        setIsOpenModal(!isOpenModal);
    };

    const handleRemove = (teacherId: string, busId: string) => {
        startTransition(() => {
            removeTeacherFromBus(teacherId, busId).then((data) => {
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
    const handleTeacherDelete = (id: string, mode: string) => {
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

    const displayTeachersData = Array.isArray(teachersData) && teachersData.length ? teachersData : mockTeachersData

    return (
        <div>
            {/* {
                isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} mode="teacher" />
            }
            <div className="p-4 flex justify-end items-center ">
                < AddData label="Add a Teacher" action={handleModal} />
            </div> */}

            <Table className="min-w-[1120px] border-separate border-spacing-y-3 bg-transparent">
                <TableHeader>
                    <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="w-[300px] text-black/60 dark:text-white/55">Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Bus No</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody className="text-sm text-black dark:text-white">
                    {
                        displayTeachersData.map((teacher: TeacherProps) => {
                            return (
                                <TableRow key={teacher.id} className="border-0 bg-white text-black shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-colors hover:bg-white dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10">
                                    <TableCell className="rounded-l-2xl px-6 py-5 align-middle">
                                        <div className="flex items-center gap-2">
                                            <img src={teacher.image && teacher.image || dashboard} alt={teacher.full_name} className="rounded-md object-cover w-9 h-9" />
                                            <span className="capitalize">{teacher.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        <CopyableText label="Email" value={teacher.email} fallback="No email" truncateClassName="max-w-[220px]" />
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        <CopyableText label="Phone number" value={teacher.phoneNumber} fallback="No phone" truncateClassName="max-w-[140px]" />
                                    </TableCell>
                                    <TableCell className="max-w-[240px] px-6 py-5 align-middle text-black/75 dark:text-white/70">
                                        <CopyableText label="Address" value={teacher.address} fallback="No address" truncateClassName="max-w-[220px]" />
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle text-[0.7rem] capitalize text-black/75 dark:text-white/70">
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
                                    <TableCell className="rounded-r-2xl px-6 py-5 align-middle">
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
            </Table>
            <Pagination count={teacherCount} pageCount={2} />

        </div>

    )
}
