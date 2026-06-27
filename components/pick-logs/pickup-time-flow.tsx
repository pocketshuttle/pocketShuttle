import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

// Convert minutes → "HH:MM"
function formatMinutesToTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface WeeklyStat {
    week: string;
    busAverage: string;
}

export const PickupTimeFlow = ({ data }: { data: WeeklyStat[] }) => {
    const xAxisLabels = data?.map((_, i) => `Week ${i + 1}`);
    const yAxisData = data?.map(d => toMinutes(d.busAverage));

    if (!data || data.length === 0) {
        return (
            <div className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                <p className="text-lg font-semibold">Pick Up Time Flow</p>
                <p className="mt-2 text-sm text-black/55 dark:text-white/55">No average pickup times found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
            <p className="pb-2 text-lg font-semibold">
                Pick Up Time Flow
            </p>
            <LineChart
                xAxis={[{
                    data: xAxisLabels,
                    scaleType: "point",
                    label: "Weeks",
                }]}
                yAxis={[{
                    valueFormatter: formatMinutesToTime,
                    label: "Avg Pickup Time",
                }]}
                series={[{
                    data: yAxisData,
                    label: "Bus Avg Pickup Time",
                }]}
                height={300}
                // @ts-ignore
                tooltip={{
                    trigger: "item",
                    formatter: (point: any) => {
                        const week = data[point.dataIndex].week;
                        const avg = data[point.dataIndex].busAverage;
                        return `Week of ${week} — Avg: ${avg}`;
                    }
                }}
            />
        </div>
    );
};
