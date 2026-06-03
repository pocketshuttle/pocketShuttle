import React from 'react'
import Image from 'next/image'
import avatar from '@/public/images/avatar.jpg'

type LateStudent = {
    studentId: string;
    studentName: string;
    studentImage: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    lateDifferenceMinutes: number;
}

type AlertsAndInsightsProps = {
    alerts: string;
    lateStudents?: LateStudent[];
}

export const AlertsAndInsights: React.FC<AlertsAndInsightsProps> = ({ alerts, lateStudents = [] }) => {
    const hasLateStudents = lateStudents.length > 0;

    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
            <p className="text-lg font-semibold">
                Alerts & Insights
            </p>
            <p className="mb-4 mt-2 text-sm text-black/60 dark:text-white/60">{alerts}</p>

            {hasLateStudents && (
                <div className="mt-4">
                    <h3 className="text-md mb-3 font-semibold">Late Students Details</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-black/[0.03] dark:bg-white/[0.06]">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-black/55 dark:text-white/55">
                                        Student
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-black/55 dark:text-white/55">
                                        Parent Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-black/55 dark:text-white/55">
                                        Phone
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-black/55 dark:text-white/55">
                                        Email
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-black/55 dark:text-white/55">
                                        Late By
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10 bg-white dark:divide-white/10 dark:bg-zinc-950">
                                {lateStudents.map((student) => (
                                    <tr key={student.studentId} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8">
                                                    <Image
                                                        className="h-8 w-8 rounded-full object-cover"
                                                        src={student.studentImage || avatar}
                                                        alt={student.studentName}
                                                        width={32}
                                                        height={32}
                                                    />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium">
                                                        {student.studentName}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {student.parentName}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {student.parentPhone}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {student.parentEmail}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                {student.lateDifferenceMinutes} min
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
