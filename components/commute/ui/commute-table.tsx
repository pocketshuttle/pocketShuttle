"use client";
import { Search } from "@/components/dashboard/search/search";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import avatar from "@/public/images/avatar.jpg"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/dashboard/pagination/pagination";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
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
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { BusProps, StudentProps } from "@/types";
import { StudentPresence } from "@/components/students/ui/presence";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import useSWR from "swr";
import { FormError } from "@/components/errorsandsuccess/form-error";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentHourInTimeZone } from "@/lib/utils";
import { CopyableText } from "@/components/ui/copyable-text";

type BusApiResponse = BusProps[] | { message?: string; error?: string };

const fetcher = async (url: string): Promise<BusApiResponse> => {
    const res = await fetch(url);
    const data = await res.json();

    if (res.status === 404) {
        return [];
    }

    if (!res.ok) {
        throw new Error(data?.message || data?.error || "Unable to fetch buses");
    }

    return data;
};

export const CommuteTable = ({ userId }: { userId: string }) => {

    const { data: busData, error, isLoading } = useSWR<BusApiResponse>(
        `/api/addbus/${userId}`,
        fetcher,
        { refreshInterval: 5000 }
    );
    const buses = Array.isArray(busData) ? busData : [];
    const hours = getCurrentHourInTimeZone("Africa/Lagos")

    const [openBusId, setOpenBusId] = useState<string | null>(null);
    return (
        <div className="relative mt-4 overflow-x-auto bg-transparent">
            <Table className="min-w-[980px] border-separate border-spacing-y-3 bg-transparent">
                <TableHeader>
                    <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="w-[280px] text-black/60 dark:text-white/55">Bus No</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>No of Kids</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-sm text-black dark:text-white">

                    {
                        isLoading && (
                            < TableRow>
                                <TableCell colSpan={5}>
                                    <div className="space-y-2">
                                        <Skeleton className="h-12 w-full mb-2 " />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    }

                    {error && (
                        <TableRow>
                            <TableCell colSpan={5}>
                                <FormError message={error.message} />
                            </TableCell>
                        </TableRow>
                    )}

                    {!isLoading && !error && buses.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-gray-400">
                                No buses found.
                            </TableCell>
                        </TableRow>
                    )}

                    {buses.map((bus: BusProps) => {
                        const isBusOpen = openBusId === bus.id;
                        const students = Array.isArray(bus.students) ? bus.students : [];
                        return (
                            <React.Fragment key={bus.id}>
                                <TableRow className="border-0 bg-white text-black shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-colors hover:bg-white dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10">
                                    <TableCell className="rounded-l-2xl px-6 py-5 align-middle text-[0.8rem] capitalize">
                                        <span>{bus.color} </span>
                                        {bus.bus_product_name || "No Bus"}
                                        <span> ({bus.bus_number})</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                        {bus.route?.route_name || "No Route"}
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle capitalize">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${bus.status === "parked" ? "bg-black/10 text-black dark:bg-white/15 dark:text-white" : "bg-black text-white dark:bg-white dark:text-black"}`}>
                                            {bus.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 align-middle capitalize text-black/75 dark:text-white/70">
                                        {students.length ? students.length : "no kids"}
                                    </TableCell>
                                    <TableCell className="rounded-r-2xl px-6 py-5 align-middle">
                                        <Button variant="outline" onClick={() => setOpenBusId(isBusOpen ? null : bus.id)}>
                                            {isBusOpen ? "Hide Bus Details" : "View Bus Details"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {isBusOpen && (
                                    <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                                        <TableCell colSpan={5}>
                                            <div className="rounded-2xl bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:bg-white/5 dark:shadow-none">
                                                <Table className="min-w-[820px] bg-transparent">
                                                    <TableHeader>
                                                        <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent dark:hover:bg-transparent">
                                                            <TableHead className="w-[260px] text-black/60 dark:text-white/55">Full Name</TableHead>
                                                            <TableHead>Gender</TableHead>
                                                            <TableHead className="">Age</TableHead>
                                                            <TableHead className="">Grade</TableHead>
                                                            <TableHead className="w-[260px]">Address</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {students.map((student: StudentProps) => (
                                                            <TableRow key={student.id} className="hover:bg-black/5 dark:hover:bg-white/10">
                                                                <TableCell className="px-4 py-4 align-middle">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Image src={student.image && student.image || avatar} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                                                                    <span className="capitalize">{student.full_name}</span>
                                                                                    <StudentPresence data={student.presence} />
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>

                                                                                <p>
                                                                                    {
                                                                                        student.presence === "NONE" ? `${student.full_name} is not in school` :
                                                                                            student.presence === "IN_BUS" ? `${student.full_name} is currently in Bus`
                                                                                                : `${student.full_name} is currently in School`
                                                                                    }
                                                                                </p>

                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </TableCell>
                                                                <TableCell className="px-4 py-4 text-black/75 dark:text-white/70">{student.gender}</TableCell>
                                                                <TableCell className="px-4 py-4 text-black/75 dark:text-white/70">{student.age}</TableCell>
                                                                <TableCell className="px-4 py-4 text-black/75 dark:text-white/70">{student.grade}</TableCell>
                                                                <TableCell className="px-4 py-4 text-black/75 dark:text-white/70">
                                                                    <CopyableText label="Address" value={student.address} fallback="No address" truncateClassName="max-w-[240px]" />
                                                                </TableCell>

                                                                <TableCell className="px-4 py-4">
                                                                    {
                                                                        student.attendance === "ABSENT" ? "" :
                                                                            <span className={`${student.status === "PICKED" ? "bg-[teal]" : "bg-[crimson]"} rounded-md p-[0.3rem] text-gray-200`}>
                                                                                {
                                                                                    student.status
                                                                                }
                                                                            </span>
                                                                    }
                                                                </TableCell>

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
        </div>
    );
};
