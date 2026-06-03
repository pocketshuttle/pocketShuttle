"use client"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { BusModal } from "./bus-modal"
import { useFetch } from "@/hooks/useFetch"
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
import { ViewStudent } from "@/components/students/ui/view-student-wrapper"
import RoutesModal from "./routes-modal"
import { BusProps } from "@/types"
import { AddRoute } from "./add-route"
import { AddData } from "@/components/ui/add-data-button"
import { EditData } from "@/components/ui/edit-data-link"
import deleted from "@/public/images/delete.json"
import LottieAnimation from "@/components/dashboard/sidebar/menuLink/lottie-animation"
import { handleDelete } from "@/actions/delete-student"
import { toast } from "@/components/ui/use-toast"
import { revalidateTag } from "next/cache"
import { useSession } from "@/hooks/useSession"

const mockBusData: BusProps[] = [
    {
        id: "mock-bus-1",
        bus_product_name: "Toyota Coaster",
        bus_number: "PS-102",
        color: "yellow",
        seat_number: 28,
        driver: { full_name: "Marcus Reed" },
        teacher: { full_name: "Amelia Hart" },
        students: [{ id: "mock-student-1", full_name: "Noah Carter" }],
        route: { route_name: "North Gate Route" },
    } as unknown as BusProps,
    {
        id: "mock-bus-2",
        bus_product_name: "Mercedes Sprinter",
        bus_number: "PS-218",
        color: "white",
        seat_number: 18,
        driver: { full_name: "Daniel Okafor" },
        teacher: { full_name: "Grace Wilson" },
        students: [{ id: "mock-student-2", full_name: "Maya Evans" }],
        route: { route_name: "Lekki Phase 1" },
    } as unknown as BusProps,
    {
        id: "mock-bus-3",
        bus_product_name: "Hyundai County",
        bus_number: "PS-330",
        color: "blue",
        seat_number: 24,
        driver: { full_name: "Samuel Briggs" },
        teacher: { full_name: "Helen Moore" },
        students: [{ id: "mock-student-3", full_name: "Leo Bennett" }],
        route: { route_name: "Ikoyi Express" },
    } as unknown as BusProps,
];

export const BusData = ({ data }: any) => {
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isOpenRouteModal, setIsRouteOpenModal] = useState(false)

    const session = useSession()
    const userId = session?.id

    const { data: routeData } = useFetch(`/api/addroute/${userId}`, userId);
    const [isHovering, setIsHovering] = useState(false);

    const busData = Array.isArray(data) && data.length ? data : mockBusData

    const [isPending, startTransition] = useTransition()

    const handleModal = () => {
        setIsOpenModal(true)
    }

    const handleDeleteBus = (id: string, mode: string) => {
        startTransition(() => {
            handleDelete(id, mode).then((data) => {
                toast({
                    description: data.message,
                });
                // revalidateTag("bus")
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }


    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[var(--bg-root)] mt-2">
            <div className="p-4 flex justify-end items-center ">
                <div className="space-x-2 flex">
                    < AddData label="Bus" action={handleModal} />

                    <Button variant="destructive" onClick={() => setIsRouteOpenModal(true)}>
                        Add bus routes
                    </Button>
                </div>
            </div>
            {
                isOpenModal && <BusModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }
            {
                isOpenRouteModal && <RoutesModal isOpenModal={isOpenRouteModal} setIsOpenModal={setIsRouteOpenModal} />
            }


            <Table className="min-w-[1120px] border-separate border-spacing-y-3 bg-transparent">
                <TableHeader >
                    <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="text-black/60 dark:text-white/55">Bus Name</TableHead>
                        <TableHead>Bus Number</TableHead>
                        <TableHead>Bus Color</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead className="w-[150px]">Driver</TableHead>
                        <TableHead className="w-[150px]">Teacher</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Routes</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-sm text-black dark:text-white">
                    {busData?.map((bus: BusProps) => {
                        return (
                            <TableRow key={bus.id} className="border-0 bg-white text-black shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-colors hover:bg-white dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10">
                                <TableCell className="rounded-l-2xl px-6 py-5 align-middle capitalize">
                                    {bus.bus_product_name}
                                </TableCell>
                                <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                    {bus.bus_number}
                                </TableCell>
                                <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                    {bus.color}
                                </TableCell>
                                <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                    {bus.seat_number}
                                </TableCell>
                                <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                    {bus.driver ? bus.driver.full_name : "no bus driver"}
                                </TableCell>
                                <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                    {
                                        bus.teacher ? bus.teacher?.full_name : "no bus teacher"
                                    }
                                </TableCell>
                                <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                    {bus.students?.length ? <ViewStudent data={bus.students} /> : "no kids"}
                                </TableCell>
                                <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">

                                    {
                                        bus.route ?
                                            <span>{bus.route.route_name}</span> : <AddRoute data={routeData} placeholder="Select Route" label="Add Route" busId={bus.id} />
                                    }
                                </TableCell>
                                <TableCell className="rounded-r-2xl px-6 py-5 align-middle">
                                    <div className="space-x-2 flex">
                                        <EditData link={`/dashboard/bus/${bus.id}`} mode="edit" />
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
                                                                 ${bus.bus_product_name}?, this will delete all its data.
                                                                    `}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive"
                                                        onClick={() => handleDeleteBus(bus.id, "bus")}
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
                    })}
                </TableBody>
            </Table>
        </div >
    )
}
