import Image from 'next/image'
import React from 'react'
import avatar from "@/public/images/avatar.svg"
import callIcon from "@/public/images/call.svg"
import commentIcon from "@/public/images/comment.svg"
import schoolbus from "@/public/images/school-bus.svg"
import { BusProps } from '@/types'

export const TeacherDetailsForParentPage = ({ bus }: BusProps) => {
    console.log(bus, "from teacher details page")
    return (
        <div className=' text-gray-700 space-y-3 px-2'>
            <header className=' text-gray-950 text-2xl font-medium border-b-4 border-[#38BDF8] py-2 mt-4 mb-4 '>
                Bus arriving in 10 mins...
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
                        <Image src={commentIcon} height={35} width={35} aria-disabled alt="call Icon" className='rounded-full ' />
                    </button>
                    <a
                        href={`tel:${bus?.teacher?.phoneNumber}`}
                        aria-label="Call teacher"
                        className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition inline-flex"
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
