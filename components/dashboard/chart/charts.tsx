import { ChartUI } from "./ui/chart-ui"

export const Charts = () => {
    return (
        <div className="bg-[var( --bg-root)] p-4">

            <h1 className={` text-[var(--textSoft)] py-4`}>Weekly Students Chart</h1>
            <div className="h-[400px] w-full">
                < ChartUI />
            </div>
        </div>
    )
}
