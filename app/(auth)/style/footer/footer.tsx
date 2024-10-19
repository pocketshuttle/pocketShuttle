"use client"
import React, { useRef } from 'react'
import { FooterPlayer } from './footer-player'
import Image from 'next/image'
import { FooterService } from './footer-service'

export const AuthFooter = () => {

    return (
        <div className='flex flex-col  items-center px-3 py-5 space-y-4 '>
            <div className=''>
                < Image src="/images/pslogo.png" alt="Pocket shuttle" width={300} height={200} />
            </div>
            <div className='flex space-x-2 py-2'>
                <FooterPlayer playerLink='/images/Facebook.mp4' />
                <FooterPlayer playerLink='/images/Tiktok.mp4' />
                <FooterPlayer playerLink='/images/Twitter.mp4' />
            </div>
            <div className='border-t-[1px] border-t-gray-600 space-y-3 py-4'>
                < FooterService />
                <small className='text-slate-500 py-4'>Copyright @ 2024 PocketShuttle, all rights reserved</small>
            </div>
        </div>
    )
}
