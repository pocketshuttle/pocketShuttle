import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface DashboardWrapperProps {
    headLabel: string
    total: number

}
export const DashboardWrapper = ({ headLabel, total }: DashboardWrapperProps) => {
    return (
        <div className="p-3 space-y-4 mt-2 bg-[#182237] rounded-xl  shadow hover:bg-blue-950 ">
            <div className="text-[0.7rem]">
                {headLabel}
            </div>
            <div className=" font-medium text-2xl">
                {total}
            </div>

        </div>
    )
}
