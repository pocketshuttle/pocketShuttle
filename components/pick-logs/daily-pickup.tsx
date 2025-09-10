import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";

interface DailyPickup {
    date: string;
    count: number;
}
interface WeeklyData {
    week: string;
    daily: DailyPickup[];
}

export const DailyPickupChart = ({ data }: { data?: WeeklyData[] }) => {
    const allDates = Array.from(
        new Set(
            (data ?? []).flatMap((week) =>
                (week.daily ?? []).map((d) => d.date)
            )
        )
    ).sort();

    if (!data || data.length === 0 || allDates.length === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-md">
                <p className="text-lg text-gray-900 py-2">Daily Pickups</p>
                <p className="text-gray-500 text-sm">No data available</p>
            </div>
        );
    }


    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-lg text-gray-900 py-2">Daily Pickups</p>
            <LineChart
                xAxis={[{ data: allDates, scaleType: "point", label: "Date" }]}
                yAxis={[{ label: "Pickups" }]}
                series={data.map((week) => ({
                    data: allDates.map(
                        (date) =>
                            week.daily?.find((d) => d.date === date)?.count ?? 0
                    ),
                    label: `Week of ${week.week}`,
                }))}
                height={300}
            />
        </div>
    );
};
