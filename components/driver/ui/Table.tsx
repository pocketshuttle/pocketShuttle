"use client"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Pagination } from "@/components/dashboard/pagination/pagination"
import Link from "next/link"
import { DriverAndTeacherModal } from "@/components/Teachers/ui/teachers-modal"
import { useFetch } from "@/hooks/useFetch"
import minus from "@/public/images/minus.json"

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
import { DriversProps } from "@/types"
import { Spinner } from "@/components/ui/spinner"
import { AddToBus } from "@/components/buses/add-to-bus"
import { AddData } from "@/components/ui/add-data-button"
import { EditData } from "@/components/ui/edit-data-link"
import LottieAnimation from "@/components/dashboard/sidebar/menuLink/lottie-animation"
import { toast } from "@/components/ui/use-toast"
import { removeDriverFromBus } from "@/actions/remove-driver"
import deleted from "@/public/images/delete.json"
import { handleDelete } from "@/actions/delete-student"
import { useSession } from "@/hooks/useSession"
import { CopyableText } from "@/components/ui/copyable-text"
import { tableStyle } from "@/components/ui/table-style"

const mockDriversData: DriversProps[] = [
    {
        id: "mock-driver-1",
        full_name: "Marcus Reed",
        email: "marcus.reed@pocketshuttle.test",
        phoneNumber: "08023452001",
        address: "16 Marina Road, Lagos Island, Lagos",
        image: "/images/no-avatar.webp",
        bus: {
            id: "mock-bus-1",
            color: "yellow",
            bus_product_name: "Toyota Coaster",
            bus_number: "PS-102",
        },
    } as DriversProps,
    {
        id: "mock-driver-2",
        full_name: "Daniel Okafor",
        email: "daniel.okafor@pocketshuttle.test",
        phoneNumber: "08023452002",
        address: "31 Admiralty Road, Lekki, Lagos",
        image: "/images/no-avatar.webp",
        bus: {
            id: "mock-bus-2",
            color: "white",
            bus_product_name: "Mercedes Sprinter",
            bus_number: "PS-218",
        },
    } as DriversProps,
    {
        id: "mock-driver-3",
        full_name: "Samuel Briggs",
        email: "samuel.briggs@pocketshuttle.test",
        phoneNumber: "08023452003",
        address: "5 Banana Island Road, Ikoyi, Lagos",
        image: "/images/no-avatar.webp",
        bus: {
            id: "mock-bus-3",
            color: "blue",
            bus_product_name: "Hyundai County",
            bus_number: "PS-330",
        },
    } as DriversProps,
];



export const DriverTable = () => {
    const session = useSession()
    const userId = session?.id

    const searchParams = useSearchParams()
    const searchDriver = searchParams.get("q") || " "

    const [isHovering, setIsHovering] = useState(false);
    const [isPending, startTransition] = useTransition()

    const router = useRouter()
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const { data, isPending: driversPending, errorMessage: driversError } = useFetch(`/api/addriver/${userId}?q=${searchDriver}`, userId);
    const { data: busData, } = useFetch(`/api/addbus/${userId}`, userId);

    const driversData = Array.isArray(data?.driver) && data.driver.length ? data.driver : mockDriversData
    const totalCount = data?.driversCount

    const handleModal = () => {
        setIsOpenModal(!isOpenModal)
    }

    const handleRemove = (driverId: string, busId: string) => {
        startTransition(() => {
            removeDriverFromBus(driverId, busId).then((data) => {
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

    // if (driversError) {
    //     return <p>Error: {driversError}</p>;
    // }
    return (
        <div className={tableStyle.wrapper}>
            {/* {
                isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} mode="driver" />
            }

            <div className="p-4 flex justify-end items-center ">
                < AddData label="Driver" action={handleModal} />
            </div> */}
            <Table className={tableStyle.table}>
                <TableHeader>
                    <TableRow className={tableStyle.headerRow}>
                        <TableHead className={`w-[300px] ${tableStyle.head}`}>Full Name</TableHead>
                        <TableHead className={tableStyle.head}>Email</TableHead>
                        <TableHead className={tableStyle.head}>Phone Number</TableHead>
                        <TableHead className={tableStyle.head}>Address</TableHead>
                        <TableHead className={tableStyle.head}>Bus</TableHead>
                        <TableHead className={tableStyle.head}>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                {driversPending ? <Spinner /> : <TableBody className={tableStyle.body}>
                    {
                        driversData && driversData?.map((driver: DriversProps, index: any) => {
                            return (
                                <TableRow key={driver.id} className={tableStyle.row}>
                                    <TableCell className={tableStyle.firstCell}>
                                        <div className="flex items-center gap-2">
                                            <img src={driver.image && driver.image || dashboard} alt={driver.full_name} className="rounded-md object-cover w-9 h-9" />
                                            <span className="">{driver.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className={tableStyle.cell}>
                                        <CopyableText label="Email" value={driver.email} fallback="No email" truncateClassName="max-w-[220px]" />
                                    </TableCell>
                                    <TableCell className={tableStyle.cell}>
                                        <CopyableText label="Phone number" value={driver.phoneNumber} fallback="No phone" truncateClassName="max-w-[140px]" />
                                    </TableCell>
                                    <TableCell className={`max-w-[240px] ${tableStyle.cell}`}>
                                        <CopyableText label="Address" value={driver.address} fallback="No address" truncateClassName="max-w-[220px]" />
                                    </TableCell>
                                    <TableCell className={`${tableStyle.cell} text-[0.7rem] capitalize`}>
                                        {
                                            driver.bus ?
                                                <div className="flex space-x-1">
                                                    <div>
                                                        <span>{driver.bus.color} </span>
                                                        {driver.bus.bus_product_name || "No Bus"}
                                                        <span> ({driver.bus.bus_number})</span>
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
                                                                 ${driver.full_name} 
                                                                    from ${driver.bus.bus_product_name}  with bus Number ${driver.bus.bus_number}`}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive"
                                                                    onClick={() => handleRemove(driver.id, driver.bus.id)}
                                                                >
                                                                    Continue
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>

                                                </div>

                                                : <div className="w-full">
                                                    {
                                                        busData &&
                                                        < AddToBus
                                                            placeholder="Select Bus"
                                                            label="Select Bus"
                                                            data={busData}
                                                            id={driver.id}
                                                            mode="driver"
                                                        />
                                                    }
                                                </div>
                                        }
                                    </TableCell>
                                    <TableCell className={tableStyle.actionCell}>
                                        <div className="space-x-2 flex text-gray-200">
                                            <EditData link={`/dashboard/drivers/${driver.id}`} mode="edit" />
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
                                                                 ${driver.full_name}?
                                                                    `}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive"
                                                            onClick={() => handleTeacherDelete(driver.id, "driver")}
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
                }

            </Table>

            <Pagination count={totalCount} pageCount={2} />
        </div >

    )
}
