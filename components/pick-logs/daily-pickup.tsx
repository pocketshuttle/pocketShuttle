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
            <div className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                <p className="text-lg font-semibold">Daily Pickups</p>
                <p className="mt-2 text-sm text-black/55 dark:text-white/55">No pickup logs found for this date range.</p>
            </div>
        );
    }


    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
            <p className="pb-2 text-lg font-semibold">Daily Pickups</p>
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
