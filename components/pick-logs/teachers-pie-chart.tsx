import * as React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { TeacherProps } from "@/types";

export default function TeachersChart({ data }: { data: TeacherProps[] }) {
    const xAxisLabels = data?.map((_, i) => `Week ${i + 1}`);

    const weeklyTotals = data?.map((teacher) => teacher.weeklyTotal ?? 0);

    if (!data || data.length === 0) {
        return (
            <div className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                <p className="text-lg font-semibold">Weekly Pickups</p>
                <p className="mt-2 text-sm text-black/55 dark:text-white/55">No weekly pickup totals found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
            <p className="pb-2 text-lg font-semibold">Weekly Pickups</p>
            <BarChart
                xAxis={[
                    {
                        id: "barCategories",
                        data: xAxisLabels,
                        scaleType: "band",
                        label: "Weeks"
                    },
                ]}
                series={[
                    {
                        data: weeklyTotals,
                        label: "Weekly Pickups",
                    },
                ]}
                height={300}
            />
        </div>
    );
}
