"use client";
import React from 'react';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
}) => {
    return (
        <div className="flex items-center space-x-4">
            <div className="flex flex-col">
                <label htmlFor="start-date" className="text-sm font-medium text-gray-700 mb-1">
                    Start Date
                </label>
                <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div className="flex flex-col">
                <label htmlFor="end-date" className="text-sm font-medium text-gray-700 mb-1">
                    End Date
                </label>
                <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
    );
};
