import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface DashboardWrapperProps {
    children: React.ReactNode
    headLabel: string
    total: number
    growth: string

}
export const DashboardWrapper = ({ children, headLabel, total, growth }: DashboardWrapperProps) => {
    return (
        <div className="p-3 space-y-4 mt-2 bg-[#182237] rounded-xl  shadow hover:bg-blue-950 ">
            <div className="text-[0.7rem]">
                {headLabel}
            </div>
            <div className=" font-medium text-lg">
                {children}
                {total}
            </div>

            <div className="text-[0.6rem]">
                {growth}
            </div>
        </div>
    )
}
