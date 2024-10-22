"use client";
import Image from "next/image";
import React from "react";
import avatar from "@/public/images/avatar.jpg";
import { Button } from "@/components/ui/button";
import { AttendanceTab } from "../ui/register-tab";

type StudentProps = {
    id: string;
    full_name: string;
    age: number;
    gender: string;
    grade: string;
    address: string;
    bus: string;
    image: string;
    parent: ParentProps;
    attendance: string
    status: string

};

type ParentProps = {
    id: string;
    full_name: string;
    email: string;
    phoneNumber: string;
    address: string;
    image: string;
    Student: StudentProps[];
};

/**
 * 
 * @param Data,  StudentProps
 * This component shows the parent of the child, the parent is fetched from the student's data
 * each child can have just one parent, but parents can have multiple kids
 * @returns JSX.Element
 */

export const GuardianPage = ({ data }: { data: StudentProps }) => {
    const [attendance, SetAttendance] = React.useState("")

    const siblings = data?.parent?.Student?.filter((sibling_id) => sibling_id.id !== data.id)

    return (
        <main className="px-4 space-y-2 w-full">
            <h2>Guardian Profile</h2>
            {data &&
                <div
                    className="flex items-center bg-[var(--bgSoft)] px-4 space-x-4 rounded-md"
                >
                    <Image
                        src={data?.parent?.image || avatar}
                        alt={data?.parent?.full_name}
                        className="rounded-md object-cover w-24 h-24 shadow-lg"
                        width={100}
                        height={100}
                    />
                    <div className="py-2 ">
                        <h2 className="capitalize">{data?.parent?.full_name}</h2>
                        <p className="text-lg text-[var(--textSoft)]">
                            {data.parent?.phoneNumber}
                        </p>
                        <p className="text-sm text-[var(--textSoft)]">
                            {data.parent?.email}
                        </p>
                        <p className="text-sm text-[var(--textSoft)]">
                            {data.parent?.address}
                        </p>

                    </div>
                </div>
            }

            <div>
                <h3 className="text-center p-5">All kids</h3>
                {siblings?.map((sibling: StudentProps) => {
                    return (
                        <div
                            key={sibling.id}
                            className="flex items-center bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md mb-2"
                        >
                            <Image
                                src={sibling?.image || avatar}
                                alt={sibling?.full_name}
                                className="rounded-md object-cover w-24 h-24 shadow-lg"
                                width={100}
                                height={100}
                            />
                            <div className="py-4 space-y-2">
                                <h2 className="capitalize text-gray-200">
                                    {sibling?.full_name}
                                </h2>
                            </div>
                            <div className="flex space-x-3 ">
                                <div>
                                    {
                                        <  AttendanceTab label1="Present" label2="Absent" data={sibling.attendance} value1="PRESENT" value2="ABSENT" SetAttendance={SetAttendance} attendance={attendance} id={sibling.id} />
                                    }
                                </div>
                                <div>
                                    {
                                        sibling.attendance === "PRESENT" ?
                                            <  AttendanceTab label1="Dropped" label2="Picked" data={sibling.status} value1="DROPPED" value2="PICKED"
                                                SetAttendance={SetAttendance} attendance={attendance} id={sibling.id} /> : ""
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
};
