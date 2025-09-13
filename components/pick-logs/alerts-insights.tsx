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
        <div className="bg-white p-4 rounded-lg shadow-md mt-2">
            <p className="text-lg text-gray-900 py-2">
                Alerts & Insights
            </p>
            <p className="text-gray-950 mb-4">{alerts}</p>

            {hasLateStudents && (
                <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Late Students Details</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Parent Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Late By
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lateStudents.map((student) => (
                                    <tr key={student.studentId} className="hover:bg-gray-50">
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
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.studentName}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {student.parentName}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {student.parentPhone}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
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
