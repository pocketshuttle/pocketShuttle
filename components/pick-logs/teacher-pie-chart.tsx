import * as React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { TeacherProps } from "@/types";

export default function TeachersChart({ data = [] }: { data: TeacherProps[] }) {
    // Teacher names for X-axis
    const xAxisLabels = data?.map((_, i) => `Week ${i + 1}`);

    // Weekly totals for Y-axis
    const weeklyTotals = data.map((teacher) => teacher.weeklyTotal ?? 0);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-lg text-gray-900 py-2 capitalize">Teachers Pickups</p>
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
