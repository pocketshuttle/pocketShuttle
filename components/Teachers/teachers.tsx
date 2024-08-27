"use client"
import React, { useState } from 'react'
import Tab from '@/components/Teachers/ui/teachers-tab'
import { DriverTable } from '../driver/ui/Table'
import { TeachersTable } from './ui/TeacherTable'

type userProps = {
    teacherCount?: number,
    driverCount?: number,
    teacherData?: any[],
    driverData?: any[]
    bus?: any[]
}
export const Teachers = ({ teacherCount, driverCount, teacherData, driverData, bus }: userProps) => {
    const [activeTab, setActiveTab] = useState("teachers")
    const handleTab = (tab: string) => {
        setActiveTab(tab)

    }

    return (
        <div>
            <nav>
                <Tab tab1='teachers' tab2='drivers' activeTab={activeTab} handleTab={handleTab} />

                {
                    activeTab === "teachers" && <div className=' flex-col gap-4 flex'>
                        <TeachersTable teacherCount={teacherCount} teachersData={teacherData} busData={bus} />
                    </div>
                }
                {
                    activeTab === "drivers" && <div className='flex flex-col gap-4'> <DriverTable /></div>
                }

            </nav>
        </div>
    )
}
