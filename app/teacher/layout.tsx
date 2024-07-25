import Navbar from "@/components/teachers-view/navbar"
import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "500", subsets: ["latin"] })
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={`h-screen ${poppins.className}`}>

            <div>
                <Navbar />
            </div>
            {children}
        </div >
    )
}

export default DashboardLayout