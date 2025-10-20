"use client"
import React, { useEffect, useState } from 'react'
import { AveragePickUp } from './bus-times'
import { StudentPickUpPattern } from './student-pickup-pattern'
import { AlertsAndInsights } from './alerts-insights'
import { getWeeklyPickupStatsForBus, getWeeklyLatePickupStats, getLateStudentDetails } from '@/actions/report-folder/get-average-pickup'
import { SelectActiveTeacher } from './select-teacher'
import { getTeacherPickupCount } from '@/actions/report-folder/get-teacher-pickup-count'
import { DailyPickupChart } from './daily-pickup'
import { getDistanceInMeters } from '@/actions/report-folder/utils/get-distance'
import { PickupTimeFlow } from './pickup-time-flow'
import TeachersChart from './teachers-pie-chart'
import { DateRangePicker } from './date-range-picker'

export const MainPickUpPage = ({ data }: any) => {
    const [filterBusId, setFilteredBusId] = useState<{ busId: string, teacherId: string, teacherName: string }>({ busId: "", teacherId: "", teacherName: "" })
    const [pickUpData, setPickupData] = useState<any[]>([])
    const [teacherPickupData, setTeacherPickupData] = useState<any[]>([])
    const [latePickupData, setLatePickupData] = useState<any[]>([])
    const [lateStudentDetails, setLateStudentDetails] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // Date range state
    const [startDate, setStartDate] = useState<string>('2025-09-12')
    const [endDate, setEndDate] = useState<string>('2025-09-20')

    const handleTeacherBusChange = (value: { busId: string, teacherId: string, teacherName: string }) => {
        setFilteredBusId(value)
        // Clear previous data when switching teachers
        setPickupData([])
        setTeacherPickupData([])
        setLatePickupData([])
        setLateStudentDetails([])
        setIsLoading(true)
    }

    useEffect(() => {
        const fetchAveragePickupTimes = async () => {
            try {
                if (filterBusId?.busId) {
                    setIsLoading(true);
                    const response = await getWeeklyPickupStatsForBus(filterBusId.busId, new Date(startDate), new Date(endDate));
                    setPickupData(response);
                } else {
                    setPickupData([]);
                }
            } catch (error) {
                console.error("Error fetching average pickup times:", error);
                setPickupData([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAveragePickupTimes();

    }, [filterBusId, startDate, endDate])


    useEffect(() => {
        const fetchTeacherPickupData = async () => {
            try {
                if (filterBusId?.teacherId) {
                    const response = await getTeacherPickupCount(filterBusId.teacherId, new Date(startDate), new Date(endDate));
                    //@ts-ignore
                    setTeacherPickupData(response);
                } else {
                    setTeacherPickupData([]);
                }
            } catch (error) {
                console.error("Error fetching teacher pickup data:", error);
                setTeacherPickupData([]);
            }
        }
        fetchTeacherPickupData();

    }, [filterBusId, startDate, endDate])

    useEffect(() => {
        const fetchLatePickupData = async () => {
            try {
                if (filterBusId?.busId) {
                    const response = await getWeeklyLatePickupStats(filterBusId.busId, new Date(startDate), new Date(endDate));
                    setLatePickupData(response);
                } else {
                    setLatePickupData([]);
                }
            } catch (error) {
                console.error("Error fetching late pickup data:", error);
                setLatePickupData([]);
            }
        }
        fetchLatePickupData();
    }, [filterBusId, startDate, endDate])

    useEffect(() => {
        const fetchLateStudentDetails = async () => {
            try {
                if (filterBusId?.busId) {
                    const response = await getLateStudentDetails(filterBusId.busId, new Date(startDate), new Date(endDate));
                    setLateStudentDetails(response);
                } else {
                    setLateStudentDetails([]);
                }
            } catch (error) {
                console.error("Error fetching late student details:", error);
                setLateStudentDetails([]);
            }
        }
        fetchLateStudentDetails();
    }, [filterBusId, startDate, endDate])

    return (
        <div>
            <header className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                <h1 className='text-2xl font-semibold col-span-2 capitalize'>{filterBusId.teacherName} Pickup Logs</h1>
                <div className='col-span-2 flex items-center justify-between '>
                    <div className='flex flex-col space-y-2'>
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                        />
                    </div>
                    <div className='flex'>
                        <SelectActiveTeacher
                            placeholder="Select Teacher"
                            label="Select Teacher"
                            data={data}
                            handleSelectChange={handleTeacherBusChange}
                        />
                    </div>
                </div>

            </header >
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="text-lg">Loading data...</div>
                </div>
            ) : !filterBusId.busId ? (
                <div className="flex justify-center items-center py-8">
                    <div className="text-lg text-gray-500">Please select a teacher to view pickup data</div>
                </div>
            ) : (
                <>
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
                            < AlertsAndInsights
                                alerts={`${latePickupData[0]?.lateStudents ?? 0} students were picked up late this week`}
                                lateStudents={lateStudentDetails}
                            />
                        </div>
                        <div className='col-span-1 '>
                            < TeachersChart data={teacherPickupData} />
                        </div>
                    </div>
                </>
            )}
        </div >
    )
}
