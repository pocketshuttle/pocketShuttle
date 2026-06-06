import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import avatar from "@/public/images/avatar.svg"
import callIcon from "@/public/images/call.svg"
import commentIcon from "@/public/images/comment.svg"
import schoolbus from "@/public/images/school-bus.svg"
import { BusProps } from '@/types'
import { useRecoilValue } from 'recoil'
import { studentETA, studentETASelector } from '@/atoms/eta'

interface PageProps {
    bus: BusProps | undefined
    userId: string
}

export const TeacherDetailsForParentPage = ({ bus, userId }: PageProps) => {
    // const openInGoogleMaps = () => {
    //         if (!coords1 || !coords2) return;
    //         const url = `https://www.google.com/maps/dir/?api=1&origin=${coords1.lat},${coords1.lng}&destination=${coords2.lat},${coords2.lng}&travelmode=driving`;
    {/* <button
                    onClick={openInGoogleMaps}
                    className="px-4 py-2 text-sm md:text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    View in Google Maps
                </button> */}
    //         window.open(url, "_blank");
    //     }

    const eta = useRecoilValue(studentETASelector(userId));

    return (
        <div className='space-y-3 rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-4 text-black'>
            <header className="border-b-2 border-sky-400 pb-3 text-lg font-semibold text-black">
                {eta.status === "loading" && "Calculating ETA..."}
                {eta.status === "success" && `Bus arriving in ${eta.value} mins...`}
                {eta.status === "error" && "Unable to calculate ETA"}
                {eta.status === "idle" && "Waiting for location..."}
            </header>
            <section className='space-y-3'>

                {/* name and teacher details  */}
                <div className='flex items-center justify-between gap-3 py-2'>
                    <div className='flex min-w-0 items-center gap-2'>
                        <Image src={bus?.teacher?.image || avatar} height={64} width={64} alt="Teachers image" className='rounded-full bg-black/10 object-cover' />
                        <div>
                            <h2 className='truncate text-lg font-semibold capitalize text-black'>{bus?.teacher?.full_name || "Teacher"} </h2>
                            <small className='text-sm text-black/55'>
                                rides
                            </small>
                        </div>
                    </div>
                    <button className='hidden rounded-full bg-black/5 p-2 sm:inline-flex' disabled>
                        <Image src={commentIcon} height={35} width={35} aria-disabled alt="comment Icon" className='rounded-full ' />
                    </button>
                    <a
                        href={`tel:${bus?.teacher?.phoneNumber}`}
                        aria-label="Call teacher"
                        className="inline-flex rounded-full bg-white p-3 ring-1 ring-black/10 transition hover:bg-gray-50"
                    >
                        <Image src={callIcon} height={24} width={24} alt="Call" />
                    </a>

                </div>

                {/* bus deatails */}
                <div className='flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-4'>
                    <div>
                        <h1 className='text-xl font-semibold uppercase text-black'>{bus?.bus_number || "N/A"}</h1>
                        <small className='text-sm capitalize text-black/55'>{bus?.bus_product_name || "No bus"}, {bus?.color || "No color"} </small>
                    </div>

                    <Image src={schoolbus} height={80} width={80} alt="Schoo bus" className='rounded-full ' />

                </div>
            </section>

        </div>
    )
}
