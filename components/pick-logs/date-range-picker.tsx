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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col">
                <label htmlFor="start-date" className="mb-1 text-sm font-medium text-black/70 dark:text-white/70">
                    Start Date
                </label>
                <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="h-10 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
                />
            </div>

            <div className="flex flex-col">
                <label htmlFor="end-date" className="mb-1 text-sm font-medium text-black/70 dark:text-white/70">
                    End Date
                </label>
                <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="h-10 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
                />
            </div>
        </div>
    );
};
