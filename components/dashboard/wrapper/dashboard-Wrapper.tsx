import { Open_Sans } from "next/font/google"

interface DashboardWrapperProps {
    headLabel: string
    total: number

}
const openSans = Open_Sans({ weight: "500", subsets: ["latin"] })
export const DashboardWrapper = ({ headLabel, total }: DashboardWrapperProps) => {
    return (
        <div className={`p-3 space-y-4 mt-2  border-[1px] border-gray-500  rounded-xl  shadow hover:bg-[var(--hoverBg)] ${openSans.className} `}>
            <div className="text-[0.8rem] text-center">
                {headLabel}
            </div>
            <div className=" font-medium text-xl text-center">
                {total}
            </div>

        </div>
    )
}
