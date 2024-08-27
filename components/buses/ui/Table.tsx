"use client"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { BusModal } from "./bus-modal"
import { useSession } from "next-auth/react"
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


export const BusData = ({ data }: any) => {
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isOpenRouteModal, setIsRouteOpenModal] = useState(false)

    const { data: session } = useSession()
    const userId = session?.user?.id

    const { data: routeData } = useFetch(`/api/addroute/${userId}`, userId);
    const [isHovering, setIsHovering] = useState(false);

    const busData = data

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


            <Table >
                <TableHeader >
                    <TableRow className=" text-[0.7rem] bg-[var(--hoverBg)] rounded-md border-none">
                        <TableHead className=" text-gray-300 border-none">Bus Name</TableHead>
                        <TableHead className=" text-gray-300">Bus Number</TableHead>
                        <TableHead className=" text-gray-300">Bus Color</TableHead>
                        <TableHead className="text-gray-300">Seats</TableHead>
                        <TableHead className="w-[150px] text-gray-300">Driver</TableHead>
                        <TableHead className="w-[150px] text-gray-300">Teacher</TableHead>
                        <TableHead className="text-gray-300">Students</TableHead>
                        <TableHead className="text-gray-300">Routes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-[0.75rem] text-gray-400 ">
                    {busData?.map((bus: BusProps) => {
                        return (
                            <TableRow key={bus.id} className="">
                                <TableCell className="capitalize ">
                                    {bus.bus_product_name}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.bus_number}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.color}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.seat_number}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.driver ? bus.driver.full_name : "no bus driver"}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {
                                        bus.teacher ? bus.teacher?.full_name : "no bus teacher"
                                    }
                                </TableCell>
                                <TableCell className="capitalize">
                                    {bus.students?.length ? <ViewStudent data={bus.students} /> : "no kids"}
                                </TableCell>
                                <TableCell className="capitalize">

                                    {
                                        bus.route ?
                                            <span>{bus.route.route_name}</span> : <AddRoute data={routeData} placeholder="Select Route" label="Add Route" busId={bus.id} />
                                    }
                                </TableCell>
                                <TableCell>
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
