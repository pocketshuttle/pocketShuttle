"use client"
import React, { useEffect, useState } from 'react'
import { AveragePickUp } from './bus-times'
import { PickupTimeFlow } from './pickup-time-flow.tsx'
import TeachersChart from './teachers-pie-chart'
import { StudentPickUpPattern } from './student-pickup-pattern'
import { AlertsAndInsights } from './alerts-insights'
import { getWeeklyPickupStatsForBus } from '@/actions/report-folder/get-average-pickup'
import { SelectActiveTeacher } from './select-teacher'
import { getTeacherPickupCount } from '@/actions/report-folder/get-teacher-pickup-count'
import { DailyPickupChart } from './daily-pickup'
import { getDistanceInMeters } from '@/actions/report-folder/utils/get-distance'

export const MainPickUpPage = ({ data }) => {
    const [filterBusId, setFilteredBusId] = useState<{}>({})
    const [pickUpData, setPickupData] = useState<any[]>([])
    const [teacherPickupData, setTeacherPickupData] = useState<any[]>([])

    const handleTeacherBusChange = (value: {}) => {
        setFilteredBusId(value)
    }

    useEffect(() => {
        const fetchAveragePickupTimes = async () => {
            try {
                if (filterBusId) {
                    const response = await getWeeklyPickupStatsForBus(filterBusId?.busId, new Date('2025-09-01'), new Date('2025-09-012'));
                    setPickupData(response);
                }
            } catch (error) {
                console.error("Error fetching average pickup times:", error);
            }
        }
        fetchAveragePickupTimes();

    }, [filterBusId])

    useEffect(() => {
        const fetchTeacherPickupData = async () => {
            try {
                if (filterBusId) {
                    const response = await getTeacherPickupCount(filterBusId?.teacherId, new Date('2025-09-01'), new Date('2025-09-012'));
                    setTeacherPickupData(response);
                }
            } catch (error) {
                console.error("Error fetching average pickup times:", error);
            }
        }
        fetchTeacherPickupData();

    }, [filterBusId])

    return (
        <div>
            <header className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                <h1 className='text-2xl font-semibold col-span-3 capitalize'>{filterBusId.teacherName} Pickup Logs</h1>
                <div className='flex'>
                    <p className='border border-gray-500 p-2 rounded-sm w-ful'>Date Range</p>
                    <SelectActiveTeacher
                        placeholder="Select Teacher"
                        label="Select Teacher"
                        data={data}
                        handleSelectChange={handleTeacherBusChange}
                    />
                </div>
            </header >
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4  items-start'>
                <AveragePickUp headLabel="Avg Pickup Time" avgTime={`${pickUpData[0]?.busAverage ?? '--'} AM`} />
                <AveragePickUp headLabel="Fastest Pick Up" avgTime={`${pickUpData[0]?.fastest?.time ?? '--'} AM`} />
                <AveragePickUp headLabel="Slowest Pick Up" avgTime={`${pickUpData[0]?.slowest?.time ?? '--'} AM`} />
                <AveragePickUp headLabel="% On-Time Parents" avgTime="82%" />
            </div>
            <div className='mt-2 grid grid-cols-1 lg:grid-cols-3 gap-2'>
                <div className='col-span-2'>
                    <  PickupTimeFlow data={pickUpData} />
                </div>
                <div className='col-span-1 '>
                    < TeachersChart data={teacherPickupData} />
                </div>
            </div>
            <div className='mt-2 grid grid-cols-1 lg:grid-cols-3 gap-2'>
                <div className='col-span-2 '>
                    <  DailyPickupChart data={teacherPickupData} />
                    < AlertsAndInsights alerts="10 students were picked up late today" />
                </div>
                <div className='col-span-1 '>
                    < TeachersChart />
                </div>
            </div>
        </div >
    )
}
