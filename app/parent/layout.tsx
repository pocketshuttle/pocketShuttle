import ParentNavbar from "@/components/parent-view/navbar"
import { getUserSession } from "@/lib/session"
import db from "@/packages/db/client"
import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "500", subsets: ["latin"] })
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getUserSession()
    const parent = user?.role === "parent" && typeof user.id === "string"
        ? await db.parent.findUnique({
            where: { id: user.id },
            select: { accountType: true, schoolId: true },
        })
        : null
    const showAddKid = parent?.accountType === "STANDALONE" && parent.schoolId === null

    return (
        <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-gray-100 text-black ${poppins.className}`}>
            <div className="w-full max-w-full overflow-x-hidden">
                <ParentNavbar data={user} showAddKid={showAddKid} />
            </div>
            {children}
        </div >
    )
}

export default DashboardLayout
