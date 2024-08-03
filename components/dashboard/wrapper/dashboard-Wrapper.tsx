import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface DashboardWrapperProps {
    headLabel: string
    total: number

}
export const DashboardWrapper = ({ headLabel, total }: DashboardWrapperProps) => {
    return (
        <div className="p-3 space-y-4 mt-2 bg-[var(--hoverBg)] border-[1px] border-gray-500  rounded-xl  shadow hover:bg-blue-950 ">
            <div className="text-[0.8rem] text-center">
                {headLabel}
            </div>
            <div className=" font-medium text-3xl text-center">
                {total}
            </div>

        </div>
    )
}
