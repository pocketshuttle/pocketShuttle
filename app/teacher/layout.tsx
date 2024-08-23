import Navbar from "@/components/teachers-view/navbar"
import { getUserSession } from "@/lib/session"
import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "500", subsets: ["latin"] })
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getUserSession()
    return (
        <div className={`h-screen ${poppins.className}`}>
            <div>
                <Navbar data={user} />
            </div>
            {children}
        </div >
    )
}

export default DashboardLayout