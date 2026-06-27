"use client"
import React, { useRef } from 'react'

export const HeroSection: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play()
        }
    }

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0 // reset video to start
        }
    }

    return (
        <section className='flex items-center'>
            <div className='flex-1 space-y-4'>
                <p>Support</p>
                <h1 className='text-4xl font-black'>Frequently Asked Question</h1>
                <p className='tracking-wide'>Need help with something, here are our most frequently asked questions</p>
            </div>
            <div>
                <video
                    ref={videoRef}
                    width={700}
                    height={200}
                    muted
                    loop
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{ display: 'block' }}
                >
                    <source src="/images/heroo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        </section>
    )
}
