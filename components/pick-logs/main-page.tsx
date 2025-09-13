"use client"
import React, { useEffect, useState } from 'react'
import { AveragePickUp } from './bus-times'
import { StudentPickUpPattern } from './student-pickup-pattern'
import { AlertsAndInsights } from './alerts-insights'
import { getWeeklyPickupStatsForBus, getWeeklyLatePickupStats } from '@/actions/report-folder/get-average-pickup'
import { SelectActiveTeacher } from './select-teacher'
import { getTeacherPickupCount } from '@/actions/report-folder/get-teacher-pickup-count'
import { DailyPickupChart } from './daily-pickup'
import { getDistanceInMeters } from '@/actions/report-folder/utils/get-distance'
import { PickupTimeFlow } from './pickup-time-flow'
import TeachersChart from './teachers-pie-chart'

export const MainPickUpPage = ({ data }: any) => {
    const [filterBusId, setFilteredBusId] = useState<{ busId: string, teacherId: string, teacherName: string }>({ busId: "", teacherId: "", teacherName: "" })
    const [pickUpData, setPickupData] = useState<any[]>([])
    const [teacherPickupData, setTeacherPickupData] = useState<any[]>([])
    const [latePickupData, setLatePickupData] = useState<any[]>([])

    const handleTeacherBusChange = (value: { busId: string, teacherId: string, teacherName: string }) => {
        setFilteredBusId(value)
    }

    useEffect(() => {
        const fetchAveragePickupTimes = async () => {
            try {
                if (filterBusId) {
                    const response = await getWeeklyPickupStatsForBus(filterBusId?.busId, new Date('2025-09-12'), new Date('2025-09-20'));
                    setPickupData(response);
                }
            } catch (error) {
                console.error("Error fetching average pickup times:", error);
            }
        }
        fetchAveragePickupTimes();

    }, [filterBusId])

    console.log(pickUpData, "pickUpData")

    useEffect(() => {
        const fetchTeacherPickupData = async () => {
            try {
                if (filterBusId) {
                    const response = await getTeacherPickupCount(filterBusId?.teacherId, new Date('2025-09-12'), new Date('2025-09-20'));
                    setTeacherPickupData(response);
                }
            } catch (error) {
                console.error("Error fetching average pickup times:", error);
            }
        }
        fetchTeacherPickupData();

    }, [filterBusId])

    useEffect(() => {
        const fetchLatePickupData = async () => {
            try {
                if (filterBusId?.busId) {
                    const response = await getWeeklyLatePickupStats(filterBusId.busId, new Date('2025-09-12'), new Date('2025-09-20'));
                    setLatePickupData(response);
                }
            } catch (error) {
                console.error("Error fetching late pickup data:", error);
            }
        }
        fetchLatePickupData();
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
                <AveragePickUp headLabel="% On-Time Parents" avgTime={`${latePickupData[0]?.onTimePercentage ?? '--'}%`} />
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
                    < AlertsAndInsights alerts={`${latePickupData[0]?.lateStudents ?? 0} students were picked up late this week`} />
                </div>
                <div className='col-span-1 '>
                    < TeachersChart data={teacherPickupData} />
                </div>
            </div>
        </div >
    )
}
