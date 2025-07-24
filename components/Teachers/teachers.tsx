"use client"
import React, { useState } from 'react'
import Tab from '@/components/Teachers/ui/teachers-tab'
import { DriverTable } from '../driver/ui/Table'
import { TeachersTable } from './ui/TeacherTable'
import { DriverAndTeacherModal } from './ui/teachers-modal'
import { AddData } from '../ui/add-data-button'

type userProps = {
    teacherCount?: number,
    driverCount?: number,
    teacherData?: any[],
    driverData?: any[]
    bus?: any[]
}
export const Teachers = ({ teacherCount, driverCount, teacherData, driverData, bus }: userProps) => {
    const [activeTab, setActiveTab] = useState("teachers")
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
    const [isHovering, setIsHovering] = useState(false);

    const handleModal = () => {
        setIsOpenModal(!isOpenModal);
    };
    const handleTab = (tab: string) => {
        setActiveTab(tab)
    }

    return (
        <div>
            <nav>
                <div className='py-3 flex items-center justify-between'>
                    <Tab tab1='teachers' tab2='drivers' activeTab={activeTab} handleTab={handleTab} />

                    <div className="p-4 flex justify-end items-center ">
                        < AddData label="Add a Teacher" action={handleModal} />
                    </div>

                </div>



                {
                    isOpenModal && <DriverAndTeacherModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} mode="teacher" />
                }

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
