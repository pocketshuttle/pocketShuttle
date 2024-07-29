"use client";
import { Search } from "@/components/dashboard/search/search";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import avatar from "@/public/images/avatar.jpg"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pagination } from "@/components/dashboard/pagination/pagination";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { useSession } from "next-auth/react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ViewStudent } from "@/components/students/ui/view-student-wrapper";
// import { StudentsData } from "./all-student";
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { BusProps, StudentProps } from "@/types";



export const CommuteTable = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [openBusId, setOpenBusId] = useState<string | null>(null);

    const { data: busData, isPending, errorMessage } = useFetch(`/api/addbus/${userId}`, userId);
    const { data: routeData, isPending: routeLoading, errorMessage: routeError } = useFetch(`/api/addroute/${userId}`, userId);

    if (isPending) {
        return <Spinner />
    }

    if (errorMessage) {
        return <div>Error: {errorMessage}</div>;
    }

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237] mt-4">
            <Table>
                <TableHeader>
                    <TableRow className="text-[0.7rem]">
                        <TableHead className="w-[250px] text-gray-300">Bus No</TableHead>
                        <TableHead className="text-gray-300">Route</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">No of Kids</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-[0.75rem] text-gray-400">
                    {busData?.map((bus: BusProps) => {
                        const isBusOpen = openBusId === bus._id;
                        return (
                            <React.Fragment key={bus._id}>
                                <TableRow>
                                    <TableCell className="text-[0.7rem] capitalize">
                                        <span>{bus.color} </span>
                                        {bus.bus_product_name || "No Bus"}
                                        <span> ({bus.bus_number})</span>
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {bus.route?.route_name || "No Route"}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        <span className={`px-2 py-[0.2rem] rounded-md text-gray-300 ${bus.status === "parked" ? "bg-[teal]" : "bg-[crimson]"}`}>
                                            {bus.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {bus.student?.length ? bus.student.length : "no kids"}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outline" onClick={() => setOpenBusId(isBusOpen ? null : bus._id)}>
                                            {isBusOpen ? "Hide Bus Details" : "View Bus Details"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {isBusOpen && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <div className="bg-gray-800 p-4 rounded-md">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className=" uppercase text-[0.7rem]">
                                                            <TableHead className="w-[250px]">Full Name</TableHead>
                                                            <TableHead>Gender</TableHead>
                                                            <TableHead className="">Age</TableHead>
                                                            <TableHead className="">Grade</TableHead>
                                                            <TableHead className="w-[250px]">Address</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {bus.student.map((student: StudentProps) => (
                                                            <TableRow key={student._id}>
                                                                <TableCell className="">
                                                                    <div className="flex items-center gap-2">
                                                                        <Image src={student.image && student.image || avatar} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                                                        <span className="">{student.full_name}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{student.gender}</TableCell>
                                                                <TableCell>{student.age}</TableCell>
                                                                <TableCell>{student.grade}</TableCell>
                                                                <TableCell>{student.address}</TableCell>

                                                                <TableCell>
                                                                    {
                                                                        student.attendance === "absent" ? "" :
                                                                            <span className="bg-[crimson] rounded-md p-[0.3rem]">
                                                                                {
                                                                                    student.status
                                                                                }
                                                                            </span>
                                                                    }
                                                                </TableCell>
                                                                <Pagination />

                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>

            <Pagination />
        </div>
    );
};
