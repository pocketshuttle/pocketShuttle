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
        <div className=' text-gray-700 space-y-3 px-2'>
            <header className="text-gray-950 text-xl font-medium border-b-4 border-[#38BDF8] py-2 mt-4 mb-4">
                {eta.status === "loading" && "Calculating ETA..."}
                {eta.status === "success" && `Bus arriving in ${eta.value} mins...`}
                {eta.status === "error" && "Unable to calculate ETA"}
                {eta.status === "idle" && "Waiting for location..."}
            </header>
            <section className='space-y-3'>

                {/* name and teacher details  */}
                <div className='flex justify-between items-center gap-3 py-2'>
                    <div className='flex items-center gap-2'>
                        <Image src={bus?.teacher?.image || avatar} height={75} width={75} alt="Teachers image" className='rounded-full bg-gray-500' />
                        <div>
                            <h2 className='text-gray-950 text-xl capitalize font-medium'>{bus?.teacher?.full_name} </h2>
                            <small className='text-gray-600/60 text-base '>
                                rides
                            </small>
                        </div>
                    </div>
                    <button className='bg-gray-600/5 rounded-full p-2' disabled>
                        <Image src={commentIcon} height={35} width={35} aria-disabled alt="comment Icon" className='rounded-full ' />
                    </button>
                    <a
                        href={`tel:${bus?.teacher?.phoneNumber}`}
                        aria-label="Call teacher"
                        className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 transition inline-flex"
                    >
                        <Image src={callIcon} height={24} width={24} alt="Call" />
                    </a>

                </div>

                {/* bus deatails */}
                <div className='flex justify-between items-center border-[0.5px] border-gray-500/10 shadow-sm rounded-md  px-2 py-4'>
                    <div>
                        <h1 className='text-xl uppercase'>{bus?.bus_number}</h1>
                        <small className='text-base text-gray-600/60 capitalize'>{bus?.bus_product_name}, {bus?.color} </small>
                    </div>

                    <Image src={schoolbus} height={80} width={80} alt="Schoo bus" className='rounded-full ' />

                </div>
            </section>

        </div>
    )
}
