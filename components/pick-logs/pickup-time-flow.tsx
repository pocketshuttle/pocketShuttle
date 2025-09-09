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

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-lg text-gray-900 py-2">
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
