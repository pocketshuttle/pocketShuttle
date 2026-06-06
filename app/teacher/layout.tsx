import Navbar from "@/components/teachers-view/navbar"
// import Navbar from "@/components/teachers-view/navbar-socket"
import { getUserSession } from "@/lib/session"
import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "500", subsets: ["latin"] })
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getUserSession()
    return (
        <div className={`min-h-screen bg-gray-100 text-black dark:bg-black dark:text-white ${poppins.className}`}>
            <div>
                <Navbar data={user} />
            </div>
            {children}
        </div >
    )
}

export default DashboardLayout
