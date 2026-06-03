"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { AveragePickUp } from './bus-times'
import { AlertsAndInsights } from './alerts-insights'
import { getWeeklyPickupStatsForBus, getWeeklyLatePickupStats, getLateStudentDetails } from '@/actions/report-folder/get-average-pickup'
import { SelectActiveTeacher } from './select-teacher'
import { getTeacherPickupCount } from '@/actions/report-folder/get-teacher-pickup-count'
import { DailyPickupChart } from './daily-pickup'
import { PickupTimeFlow } from './pickup-time-flow'
import TeachersChart from './teachers-pie-chart'
import { DateRangePicker } from './date-range-picker'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Bus, CalendarDays, FileText, GraduationCap, UsersRound } from 'lucide-react'

type ReportSummary = {
    totalPickups: number;
    totalTeachers: number;
    totalBuses: number;
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    return {
        startDate: toDateInputValue(start),
        endDate: toDateInputValue(end),
    };
};

export const MainPickUpPage = ({ data, summary }: { data: any[], summary: ReportSummary }) => {
    const [filterBusId, setFilteredBusId] = useState<{ busId: string, teacherId: string, teacherName: string }>({ busId: "", teacherId: "", teacherName: "" })
    const [pickUpData, setPickupData] = useState<any[]>([])
    const [teacherPickupData, setTeacherPickupData] = useState<any[]>([])
    const [latePickupData, setLatePickupData] = useState<any[]>([])
    const [lateStudentDetails, setLateStudentDetails] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const defaultRange = useMemo(() => getDefaultRange(), [])

    const [startDate, setStartDate] = useState<string>(defaultRange.startDate)
    const [endDate, setEndDate] = useState<string>(defaultRange.endDate)

    const assignedTeachers = data.filter((teacher) => teacher.busId).length;
    const selectedTeacher = filterBusId.teacherName || "Select a teacher";

    const handleTeacherBusChange = (value: { busId: string, teacherId: string, teacherName: string }) => {
        setFilteredBusId(value)
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
                    setTeacherPickupData(Array.isArray(response) ? response : []);
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
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
            <header className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-black/55 dark:text-white/55">Reports</p>
                        <h1 className="text-2xl font-semibold">Pickup performance</h1>
                    </div>
                    <Badge className="w-fit bg-black text-white dark:bg-white dark:text-black">
                        {selectedTeacher}
                    </Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ReportStat icon={<FileText className="h-5 w-5" />} label="Total pickup logs" value={summary.totalPickups} />
                    <ReportStat icon={<GraduationCap className="h-5 w-5" />} label="Teachers" value={summary.totalTeachers} />
                    <ReportStat icon={<Bus className="h-5 w-5" />} label="Buses" value={summary.totalBuses} />
                    <ReportStat icon={<UsersRound className="h-5 w-5" />} label="Assigned teachers" value={assignedTeachers} />
                </div>
            </header>

            <section className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Report filters</h2>
                        </div>
                        <p className="text-sm text-black/55 dark:text-white/55">
                            Choose a teacher and date range to generate weekly pickup insights.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                        />
                        <div className="min-w-[220px]">
                            <SelectActiveTeacher
                                placeholder="Select Teacher"
                                label="Select Teacher"
                                data={data}
                                handleSelectChange={handleTeacherBusChange}
                            />
                        </div>
                    </div>
                </div>
            </section>
            {isLoading ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-black/10 bg-white text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                    <div className="text-lg">Loading report data...</div>
                </div>
            ) : !filterBusId.busId ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-black/15 bg-white p-6 text-center text-black dark:border-white/15 dark:bg-zinc-950 dark:text-white">
                    <BarChart3 className="mb-3 h-9 w-9 text-black/45 dark:text-white/45" />
                    <p className="text-lg font-semibold">Select a teacher to view pickup reports</p>
                    <p className="mt-1 max-w-md text-sm text-black/55 dark:text-white/55">
                        Reports are generated from pickup logs, arrival timestamps, assigned buses, and parent pickup timing.
                    </p>
                </div>
            ) : (
                <>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                        <AveragePickUp headLabel="Avg Pickup Time" avgTime={formatReportTime(pickUpData[0]?.busAverage)} />
                        <AveragePickUp headLabel="Fastest Pick Up" avgTime={formatReportTime(pickUpData[0]?.fastest?.time)} />
                        <AveragePickUp headLabel="Slowest Pick Up" avgTime={formatReportTime(pickUpData[0]?.slowest?.time)} />
                        <AveragePickUp headLabel="% On-Time Parents" avgTime={`${latePickupData[0]?.onTimePercentage ?? '--'}%`} />
                    </div>
                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                        <div className='col-span-2'>
                            <PickupTimeFlow data={pickUpData} />
                        </div>
                        <div>
                            < TeachersChart data={teacherPickupData} />
                        </div>
                    </div>
                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                        <div className='lg:col-span-2'>
                            <DailyPickupChart data={teacherPickupData} />
                        </div>
                        <AlertsAndInsights
                            alerts={`${latePickupData[0]?.lateStudents ?? 0} students were picked up late in this range`}
                            lateStudents={lateStudentDetails}
                        />
                    </div>
                </>
            )}
        </div >
    )
}

function formatReportTime(value?: string) {
    return value ? value : "--";
}

function ReportStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                {icon}
            </div>
            <div>
                <p className="text-sm text-black/55 dark:text-white/55">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
            </div>
        </div>
    )
}
