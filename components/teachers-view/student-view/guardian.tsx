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
}
export const GuardianPage = ({ data }: any) => {
    return (
        <main className="px-4 space-y-2 w-full">
            <h2>Guardian Profile</h2>
            {
                data?.map((student: StudentProps) => (
                    <div className="flex items-center  bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md">
                        <Image src={student.image || avatar} alt={student.full_name} className="rounded-md object-cover w-24 h-24 shadow-lg" width={100} height={100} />

                        <div className="py-4 space-y-2">
                            <h2 className="space-x-2">
                                {student.full_name}
                            </h2>
                            <p className="text-lg text-[var(--textSoft)]">phone number</p>
                            <p className="text-sm text-[var(--textSoft)]">email address</p>
                        </div>
                    </div>
                ))
            }
        </main>
    )
}

