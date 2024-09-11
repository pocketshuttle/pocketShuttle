import { ChartUI } from "./ui/chart-ui"
import { Poppins } from "next/font/google"

const poppins = Poppins({ weight: "500", subsets: ["latin"] })
export const Charts = () => {
    return (
        <div className="bg-[var( --bg-root)] p-4">

            <h1 className={`${poppins} text-[var(--textSoft)] py-4`}>Weekly Students Chart</h1>
            <div className="h-[400px] w-full">
                < ChartUI />
            </div>
        </div>
    )
}
