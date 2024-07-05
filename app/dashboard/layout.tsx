import Navbar from "@/components/dashboard/navbar/navbar"
import Sidebar from "@/components/dashboard/sidebar/sidebar"
import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "500", subsets: ["latin"] })
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={`flex h-screen ${poppins.className}`}>
            <div className="w-1/5 bg-[#182237] p-3">
                <Sidebar />
            </div>

            <div className="flex-1 p-3">
                <Navbar />
                {children}
            </div>


        </div >
    )
}

export default DashboardLayout