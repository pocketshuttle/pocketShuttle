"use client";
import Image from "next/image";
import React from "react";
import avatar from "@/public/images/avatar.jpg";
import { Button } from "@/components/ui/button";
import { AttendanceTab } from "../ui/register-tab";
import callIcon from "@/public/images/call.svg"

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
    busId: string

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

    //returns siblings in same bus
    const siblings = data?.parent?.Student?.filter((sibling_id) => {
        return (sibling_id.id !== data.id && sibling_id.busId === data.busId)
    })


    return (
        <main className=" space-y-2 w-full"
            style={{ scrollBehavior: 'smooth', fontFamily: 'Arial, sans-serif' }}
        >
            <h2 className="text-gray-950 text-2xl font-medium text-center py-4">Guardian Profile</h2>
            {data &&
                <div
                    className="max-w-xl mx-auto flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
                >
                    {/* Left: Image + Info */}
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Image
                            src={data?.parent?.image || avatar}
                            alt={data?.parent?.full_name}
                            className="rounded-xl object-cover w-20 h-20 shadow-md"
                            width={80}
                            height={80}
                        />

                        {/* Info */}
                        <div className="space-y-1">
                            <h2 className="capitalize text-lg font-semibold text-gray-900">
                                {data?.parent?.full_name}
                            </h2>

                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                {data?.parent?.email}
                            </p>

                            <p className="max-w-[240px] break-words text-sm leading-snug text-gray-700">
                                {data?.parent?.address}
                            </p>
                        </div>
                    </div>

                    {/* Right: Call Button */}
                    <a
                        href={`tel:${data?.parent?.phoneNumber}`}
                        aria-label="Call parent"
                        className="bg-gray-50 hover:bg-gray-100 rounded-full p-4 transition shadow-sm"
                    >
                        <Image src={callIcon} height={24} width={24} alt="Call" />
                    </a>
                </div>

            }

            <div>
                <h3 className="text-center p-5 text-gray-950 text-xl capitalize">{data?.full_name} Siblings</h3>
                {siblings?.map((sibling: StudentProps) => {
                    return (
                        <div
                            key={sibling.id}
                            className="flex items-center text-gray-950 py-2 px-4 space-x-4 rounded-md mb-2"
                        >
                            <Image
                                src={sibling?.image}
                                alt={sibling?.full_name}
                                className="rounded-md object-cover w-24 h-24 shadow-lg"
                                width={100}
                                height={100}
                            />
                            <div className=" space-x-3 ">
                                <div className="py-4 space-y-2">
                                    <h2 className="capitalize text-xl">
                                        {sibling?.full_name}
                                    </h2>
                                </div>
                                <div className="flex gap-2">

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
                        </div>
                    );
                })}
            </div>
        </main>
    );
};
