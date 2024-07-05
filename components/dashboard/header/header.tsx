import Image from "next/image"
import students from "@/public/images/students.svg"


export const DashboardHeader = () => {
    return (
        <div className="flex items-center justify-start space-x-3 mb-3">
            <Image src={students} alt="header" className="w-5 rounded-full object-cover" />
            <div className="flex flex-col" >
                <span className="text-[0.8rem] font-medium">User name</span>
                <span className="text-[0.7rem] text-[#b7cac1]">position</span>
            </div>
        </div>
    )
}
