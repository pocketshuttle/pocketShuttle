"use client"
import { BusArrival } from '@/components/parent-view/bus-arrival'
import { StudentProps } from '@/types'
import { GuardianPage } from './guardian'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'
interface StudentHomePageProps {
    studentData: StudentProps
    teacherId: string
}
export const StudentHomePage = ({ studentData, teacherId }: StudentHomePageProps) => {
    const y = useMotionValue(0)
    const [expanded, setExpanded] = useState(true)

    const expandedHeight = "70vh";
    const collapsedHeight = "30vh"

    //background overlay
    const overlayOpacity = useTransform(y, [0, 300], [0.5, 0])


    return (
        <div className='relative w-full h-screen overflow-hidden'>
            {/* Map at full screen */}
            <div className="absolute inset-0">
                <BusArrival parentAddress={studentData?.parent?.address || ""} parentId={studentData?.parent?.id || ""} teacherId={teacherId || ""} page="coordinator_view" />
            </div>

            {
                expanded && (
                    <motion.div
                        className='absolute inset-0 bg-black'
                        style={{ opacity: overlayOpacity }}
                        onClick={(() => setExpanded(false))}
                    />
                )
            }

            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) {
                        setExpanded(false)
                    } else {
                        setExpanded(true)
                    }
                }}
                initial={{ y: 0 }}
                animate={{
                    height: expanded ? expandedHeight : collapsedHeight,
                    y: 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg overflow-y-auto"
            >
                <div className="w-full flex justify-center p-2">
                    <div className="w-12 h-1.5 bg-gray-400 rounded-full" />
                </div>
                {/* @ts-ignore */}
                <GuardianPage data={studentData} />
            </motion.div>

        </div>
    )
}