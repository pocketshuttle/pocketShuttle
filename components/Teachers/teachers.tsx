"use client"
import React, { useState } from 'react'
import Tab from '@/components/Teachers/ui/teachers-tab'
import TeachersUI from './ui/teacher-ui'
import { DriverTable } from '../driver/ui/Table'

export const Teachers = () => {
    const [activeTab, setActiveTab] = useState("teachers")

    const handleTab = (tab: string) => {
        setActiveTab(tab)
    }

    return (
        <div>
            <nav>
                <Tab tab1='teachers' tab2='drivers' activeTab={activeTab} handleTab={handleTab} />

                {
                    activeTab === "teachers" && <div className='flex flex-col gap-4'>
                        <TeachersUI />
                    </div>
                }
                {
                    activeTab === "drivers" && <div className='flex flex-col gap-4'> <DriverTable /></div>
                }

            </nav>
        </div>
    )
}
