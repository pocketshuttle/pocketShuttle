"use client"
import Image from 'next/image'
import React from 'react'
import avatar from "@/public/images/avatar.jpg"
type StudentProps = {
    _id: string,
    full_name: string,
    age: number,
    gender: string,
    grade: string,
    address: string,
    bus: string,
    image: string
    parent: ParentProps
}

type ParentProps = {
    id: string;
    full_name: string;
    email: string;
    phoneNumber: string;
    address: string;
    image: string;
};

/**
 * 
 * @param Data,  StudentProps
 * This component shows the parent of the child, the oarent is fetched from the students data
 * each child can have just one parent, but parents can have multiple kids
 * @returns 
 */
export const GuardianPage = ({ data }: any) => {
    console.log(data?.students)
    return (
        <main className="px-4 space-y-2 w-full">
            <h2>Guardian Profile</h2>
            {
                data?.students?.map((student: StudentProps) => (
                    <div className="flex items-center  bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md">
                        <Image src={student?.parent?.image || avatar} alt={student?.parent?.full_name} className="rounded-md object-cover w-24 h-24 shadow-lg" width={100} height={100} />

                        <div className="py-4 space-y-2">
                            <h2 className='capitalize'> {student?.parent?.full_name}
                            </h2>
                            <p className="text-lg text-[var(--textSoft)]">{student.parent.phoneNumber}</p>
                            <p className="text-sm text-[var(--textSoft)]">{student.parent.email}</p>
                            <p className="text-sm text-[var(--textSoft)]">{student.parent.address}</p>
                        </div>
                    </div>
                ))
            }


        </main >
    )
}

